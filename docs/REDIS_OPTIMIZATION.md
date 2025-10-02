# Redis 请求优化指南

## 🔍 问题诊断: 为何一天消耗50万次?

### 根本原因分析

经过代码审查,发现以下严重问题:

#### ❌ 问题1: KEYS 命令滥用 (最严重)

**发现**: 代码中有 **248 处** `client.keys()` 调用

**问题**:
- `KEYS` 命令是 O(n) 复杂度,需要扫描整个键空间
- Upstash 按请求计费,每次 `keys()` = 1 次请求
- 每次还需要遍历结果,每个键再做 `hgetall()` = N 次请求

**示例问题代码**:
```javascript
// ❌ 低效实现 (src/models/redis.js:1053)
async getAllClaudeAccounts() {
  const keys = await this.client.keys('claude:account:*')  // 1次请求
  const accounts = []
  for (const key of keys) {
    const accountData = await this.client.hgetall(key)     // N次请求
    accounts.push({ id: key.replace('claude:account:', ''), ...accountData })
  }
  return accounts  // 总计: 1 + N 次请求
}
```

**影响**:
- 假设 10 个账户: 11 次请求/调用
- 每 5 分钟调用一次: 11 × 288 = 3,168 次/天
- 3 个平台 (Claude/OpenAI/Gemini): 9,504 次/天

#### ❌ 问题2: 高频定时任务

**限流清理服务** (每 5 分钟):
```javascript
async performCleanup() {
  // 每次清理会调用:
  await cleanupOpenAIAccounts()    // keys() + N×hgetall()
  await cleanupClaudeAccounts()    // keys() + N×hgetall()
  await cleanupClaudeConsoleAccounts() // keys() + N×hgetall()
}
```

**计算** (假设 30 个账户):
- keys() 调用: 3 次
- hgetall(): 30 次
- 限流状态检查: ~30 次
- **每次清理 ≈ 63 次 Redis 请求**
- 每天 288 次清理 = **18,144 次/天**

#### ❌ 问题3: API 请求中的重复查询

每次 API 请求可能触发:
```javascript
// 1. 账户选择
const accounts = await getAllClaudeAccounts() // keys() + N×hgetall()

// 2. 统计记录
await redis.hincrby(`usage:${key}:${model}`, 'requests', 1)

// 3. 会话管理
await redis.get(`session:${token}`)
await redis.set(`session:${token}`, data, 'EX', 3600)
```

**估算**: 每个 API 请求 ≈ 15-20 次 Redis 操作

#### ❌ 问题4: 统计和监控

```javascript
// 统计聚合 (每小时)
await getAllAccountsUsageStats()  // keys() + 大量聚合操作

// 缓存监控
setInterval(() => {
  // 定期检查缓存状态
}, 60000)
```

### 📊 50万次/天的可能场景

| 场景 | 账户数 | API请求/天 | 估算Redis请求/天 |
|------|--------|-----------|-----------------|
| 小规模 | 10 | 100 | ~30,000 |
| 中规模 | 30 | 500 | ~150,000 |
| 大规模 | 50 | 1000 | ~350,000 |
| **极端** | **100** | **2000** | **~800,000** |

**你的情况可能是**:
- 账户数较多 (30-50个)
- 启用了多个平台
- API 调用频繁
- 加上定时任务的累积效应

## 🛠️ 优化方案

### 方案1: 停用 KEYS 命令,使用 SET/ZSET 索引 (推荐)

**当前实现**:
```javascript
// ❌ 每次都要扫描
async getAllClaudeAccounts() {
  const keys = await this.client.keys('claude:account:*')  // O(n)
  // ...
}
```

**优化后**:
```javascript
// ✅ 使用 SET 维护账户索引
async createClaudeAccount(accountId, data) {
  await this.client.hset(`claude:account:${accountId}`, data)
  await this.client.sadd('claude:accounts:index', accountId)  // 加入索引
}

async getAllClaudeAccounts() {
  const accountIds = await this.client.smembers('claude:accounts:index') // O(1)
  const accounts = []
  for (const id of accountIds) {
    const data = await this.client.hgetall(`claude:account:${id}`)
    accounts.push({ id, ...data })
  }
  return accounts
}
```

**收益**: 减少 90% 的 keys() 调用

### 方案2: 批量操作使用 Pipeline

**当前实现**:
```javascript
// ❌ 串行操作
for (const account of accounts) {
  const data = await this.client.hgetall(`claude:account:${account.id}`)
  accounts.push(data)
}
```

**优化后**:
```javascript
// ✅ 使用 Pipeline 批量获取
const pipeline = this.client.pipeline()
for (const id of accountIds) {
  pipeline.hgetall(`claude:account:${id}`)
}
const results = await pipeline.exec()
```

**收益**: N 次请求 → 1 次请求

### 方案3: 本地缓存热数据

```javascript
const NodeCache = require('node-cache')
const accountCache = new NodeCache({ stdTTL: 300 }) // 5分钟缓存

async getAllClaudeAccounts() {
  const cached = accountCache.get('all_accounts')
  if (cached) return cached

  const accounts = await this._fetchAllAccountsFromRedis()
  accountCache.set('all_accounts', accounts)
  return accounts
}
```

**收益**: 减少 80% 重复查询

### 方案4: 调整定时任务策略

```javascript
// 当前: 无论是否有限流都扫描所有账户
async performCleanup() {
  const accounts = await getAllAccounts() // 全量扫描
  for (const account of accounts) {
    await checkRateLimit(account) // 每个都检查
  }
}

// ✅ 优化: 只检查有限流标记的账户
async performCleanup() {
  const limitedAccountIds = await this.client.smembers('rate_limited:accounts')
  for (const id of limitedAccountIds) {
    const isStillLimited = await checkRateLimit(id)
    if (!isStillLimited) {
      await this.client.srem('rate_limited:accounts', id) // 移除标记
    }
  }
}
```

**收益**: 减少 95% 不必要的检查

## 🚀 立即行动方案

### 短期方案 (已实施)

1. **调整定时任务间隔**:
   ```bash
   # Render 环境变量
   RATE_LIMIT_CLEANUP_INTERVAL=30  # 5分钟 → 30分钟
   TOKEN_REFRESH_INTERVAL=30        # 15分钟 → 30分钟
   ```
   **效果**: 减少 80% 定时任务请求

2. **升级 Upstash 或换 Redis**:
   - Upstash Pro: $10/月 (1000万请求)
   - Redis Labs: 免费 30MB (无请求限制)
   - 自建 Redis: VPS 部署

### 中期方案 (代码优化)

1. **实现 SET 索引系统** (2-4小时):
   - 修改 `src/models/redis.js`
   - 为所有账户类型添加索引
   - 迁移现有数据到索引

2. **启用 Pipeline 批量操作** (1-2小时):
   - 修改所有批量查询逻辑
   - 使用 `ioredis` 的 pipeline 功能

3. **添加本地缓存层** (1-2小时):
   - 安装 `node-cache`
   - 缓存账户列表、配置等热数据

### 长期方案 (架构优化)

1. **引入 Redis 连接池**
2. **实现读写分离** (如果使用主从)
3. **监控和告警系统**
4. **自动扩容策略**

## 📈 预期效果

| 优化项 | 当前 | 优化后 | 减少 |
|--------|------|--------|------|
| 定时任务间隔 | 18,144/天 | 3,024/天 | 83% |
| 移除 keys() | 9,504/天 | 950/天 | 90% |
| 启用 Pipeline | N×请求 | 1×请求 | 90% |
| 本地缓存 | 100% Redis | 20% Redis | 80% |
| **总计** | **50万/天** | **<5万/天** | **>90%** |

## 🔍 诊断工具

### 1. 查看 Upstash 使用情况

登录 Upstash 控制台: https://console.upstash.com/
- 查看 "Daily Requests" 图表
- 查看 "Command Stats" 了解哪些命令最频繁

### 2. 启用 Redis 慢日志

```javascript
// 在 Redis 客户端启用监控
redis.monitor((err, monitor) => {
  monitor.on('monitor', (time, args) => {
    if (args[0] === 'keys') {
      console.warn('⚠️ KEYS command detected:', args)
    }
  })
})
```

### 3. 统计实际请求数

```javascript
// 添加请求计数中间件
let redisRequestCount = 0
const originalCommand = redis.sendCommand.bind(redis)
redis.sendCommand = (...args) => {
  redisRequestCount++
  return originalCommand(...args)
}

setInterval(() => {
  console.log(`Redis requests in last minute: ${redisRequestCount}`)
  redisRequestCount = 0
}, 60000)
```

## 💡 最佳实践

1. **永远不要在生产环境使用 KEYS 命令**
2. **使用 SET/ZSET 维护索引而非扫描**
3. **批量操作优先使用 Pipeline**
4. **热数据必须有本地缓存**
5. **定时任务间隔要合理(15-30分钟)**
6. **监控 Redis 请求数量和成本**

## 📚 参考资源

- [Redis KEYS 命令危害](https://redis.io/commands/keys/)
- [Redis Pipeline 使用](https://redis.io/docs/manual/pipelining/)
- [Upstash 计费说明](https://docs.upstash.com/redis/features/pricing)
- [ioredis 文档](https://github.com/luin/ioredis)
