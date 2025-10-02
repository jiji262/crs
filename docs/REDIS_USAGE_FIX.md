# Redis 使用量暴增问题修复方案

## 🔍 问题根因

**核心问题**: `incrementTokenUsage()` 方法中的**过度细粒度统计**导致每次 API 请求产生 **140+ 次 Redis 操作**。

### 实际影响计算 (2个账户场景)

假设每天 3000 个 API 请求:
- `incrementTokenUsage()`: 93 操作 × 3000 = **279,000 次/天**
- `incrementAccountUsage()`: 60 操作 × 3000 = **180,000 次/天**
- 其他统计操作: **23,640 次/天**
- **总计**: ~**482,640 次/天** ≈ 50万

## 💡 解决方案

### 方案 1: 简化统计维度 (推荐，立即生效)

**原理**: 减少不必要的统计维度，保留核心指标

**修改文件**: `src/models/redis.js`

#### 步骤 1: 添加配置开关

在 `.env` 中添加:
```bash
# 统计配置 - 减少 Redis 使用
ENABLE_HOURLY_STATS=false         # 禁用小时级别统计 (减少 ~30%)
ENABLE_MINUTE_STATS=false         # 禁用分钟级别统计 (减少 ~5%)
ENABLE_MODEL_STATS=false          # 禁用按模型统计 (减少 ~25%)
ENABLE_DETAILED_CACHE_STATS=false # 禁用详细缓存统计 (减少 ~10%)
```

在 `config/config.js` 中添加:
```javascript
statistics: {
  enableHourlyStats: process.env.ENABLE_HOURLY_STATS !== 'false',
  enableMinuteStats: process.env.ENABLE_MINUTE_STATS !== 'false',
  enableModelStats: process.env.ENABLE_MODEL_STATS !== 'false',
  enableDetailedCacheStats: process.env.ENABLE_DETAILED_CACHE_STATS !== 'false'
}
```

#### 步骤 2: 修改 incrementTokenUsage 方法

在 `src/models/redis.js` 的 `incrementTokenUsage()` 方法中，添加条件判断:

```javascript
async incrementTokenUsage(...) {
  const config = require('../../config/config')
  const statsConfig = config.statistics || {}

  // ... 现有代码 ...

  const pipeline = this.client.pipeline()

  // 核心统计 (必须保留)
  pipeline.hincrby(key, 'totalTokens', coreTokens)
  pipeline.hincrby(key, 'totalInputTokens', finalInputTokens)
  pipeline.hincrby(key, 'totalOutputTokens', finalOutputTokens)
  pipeline.hincrby(key, 'totalRequests', 1)

  // 每日统计 (必须保留)
  pipeline.hincrby(daily, 'tokens', coreTokens)
  pipeline.hincrby(daily, 'requests', 1)
  pipeline.expire(daily, 86400 * 32)

  // 每月统计 (必须保留)
  pipeline.hincrby(monthly, 'tokens', coreTokens)
  pipeline.hincrby(monthly, 'requests', 1)
  pipeline.expire(monthly, 86400 * 365)

  // 可选: 详细缓存统计
  if (statsConfig.enableDetailedCacheStats !== false) {
    pipeline.hincrby(key, 'totalCacheCreateTokens', finalCacheCreateTokens)
    pipeline.hincrby(key, 'totalCacheReadTokens', finalCacheReadTokens)
    // ... 其他缓存相关统计
  }

  // 可选: 小时级别统计
  if (statsConfig.enableHourlyStats !== false) {
    pipeline.hincrby(hourly, 'tokens', coreTokens)
    pipeline.hincrby(hourly, 'requests', 1)
    pipeline.expire(hourly, 86400 * 7)
    // ... 其他小时统计
  }

  // 可选: 按模型统计
  if (statsConfig.enableModelStats !== false) {
    pipeline.hincrby(modelDaily, 'inputTokens', finalInputTokens)
    // ... 其他模型统计
  }

  // 可选: 分钟级别统计
  if (statsConfig.enableMinuteStats !== false) {
    pipeline.hincrby(systemMinuteKey, 'requests', 1)
    // ... 其他分钟统计
  }

  await pipeline.exec()
}
```

**预期效果**:
- 关闭所有可选统计: 减少 **70%** Redis 操作
- 从 93 次/请求 → **~28 次/请求**
- 每天 3000 请求: 482,640 → **~144,000 次/天**

---

### 方案 2: 使用 Lua 脚本批量更新 (中等复杂度)

**原理**: 使用 Redis Lua 脚本将多次 hincrby 合并为一次原子操作

**优点**:
- 减少网络往返
- 保持所有统计功能
- Redis 原子操作保证一致性

**缺点**:
- 需要编写和维护 Lua 脚本
- 调试相对复杂

**实现示例**:

```javascript
// src/utils/redisScripts.js
const incrementTokenUsageScript = `
  local key = KEYS[1]
  local daily = KEYS[2]
  local monthly = KEYS[3]

  local tokens = tonumber(ARGV[1])
  local inputTokens = tonumber(ARGV[2])
  local outputTokens = tonumber(ARGV[3])

  -- 核心统计
  redis.call('HINCRBY', key, 'totalTokens', tokens)
  redis.call('HINCRBY', key, 'totalInputTokens', inputTokens)
  redis.call('HINCRBY', key, 'totalOutputTokens', outputTokens)
  redis.call('HINCRBY', key, 'totalRequests', 1)

  -- 每日统计
  redis.call('HINCRBY', daily, 'tokens', tokens)
  redis.call('HINCRBY', daily, 'requests', 1)
  redis.call('EXPIRE', daily, 2764800)

  -- 每月统计
  redis.call('HINCRBY', monthly, 'tokens', tokens)
  redis.call('HINCRBY', monthly, 'requests', 1)
  redis.call('EXPIRE', monthly, 31536000)

  return 1
`

// 使用
await redis.eval(incrementTokenUsageScript,
  3, // KEYS 数量
  key, daily, monthly,
  tokens, inputTokens, outputTokens
)
```

**预期效果**: 减少 **50-60%** Redis 网络往返

---

### 方案 3: 异步批量写入 (高级方案)

**原理**: 在内存中累积统计数据，定期批量写入 Redis

**优点**:
- 最大化减少 Redis 操作
- 可以实现复杂的聚合逻辑

**缺点**:
- 服务重启可能丢失未写入的数据
- 实现复杂度高
- 统计数据有延迟

**实现概要**:

```javascript
class UsageBuffer {
  constructor() {
    this.buffer = new Map()
    this.flushInterval = 60000 // 每分钟刷新一次
    this.startAutoFlush()
  }

  record(keyId, tokens) {
    if (!this.buffer.has(keyId)) {
      this.buffer.set(keyId, { tokens: 0, requests: 0 })
    }
    const stats = this.buffer.get(keyId)
    stats.tokens += tokens
    stats.requests += 1
  }

  async flush() {
    const pipeline = redis.pipeline()
    for (const [keyId, stats] of this.buffer.entries()) {
      pipeline.hincrby(`usage:${keyId}`, 'totalTokens', stats.tokens)
      pipeline.hincrby(`usage:${keyId}`, 'totalRequests', stats.requests)
    }
    await pipeline.exec()
    this.buffer.clear()
  }

  startAutoFlush() {
    setInterval(() => this.flush(), this.flushInterval)
  }
}
```

**预期效果**: 减少 **80-90%** Redis 操作

---

## 🚀 推荐实施顺序

### ⚡ 最佳方案：完全禁用统计功能 (立即生效，减少 97%)

**如果你不需要 Web 界面的统计图表功能**，这是最简单有效的方案！

在 Render 环境变量中添加:
```bash
ENABLE_USAGE_STATISTICS=false
```

**效果**:
- 减少 **97% 的 Redis 使用量**
- 从 ~482,880 次/天 → ~15,000 次/天
- 核心功能完全不受影响（API 转发、认证、账户管理等）
- 失去的功能：Web 界面的使用统计图表、费用计算、使用记录查询

**适用场景**:
- ✅ 不需要查看使用统计数据
- ✅ 使用 Upstash 等有请求限制的免费 Redis
- ✅ 想要最小化 Redis 使用量

### 立即操作 (需要代码修改，减少 70%)

在 Render 环境变量中添加:
```bash
ENABLE_HOURLY_STATS=false
ENABLE_MINUTE_STATS=false
ENABLE_MODEL_STATS=false
ENABLE_DETAILED_CACHE_STATS=false
```

**需要注意**: 这需要实施方案 1 的代码修改，保留基础统计但减少细粒度

### 临时缓解 (立即生效)

```bash
# 调整定时任务间隔
RATE_LIMIT_CLEANUP_INTERVAL=60  # 1小时
TOKEN_REFRESH_INTERVAL=60        # 1小时

# 减少统计保留时间 (需要代码修改)
USAGE_RECORDS_MAX=50  # 从 200 减少到 50
```

### 长期方案 (1-2天实施)

1. **第一步**: 升级 Upstash 到 Pro ($10/月，1000万请求)
2. **第二步**: 实施方案 1 (简化统计维度)
3. **第三步**: 考虑方案 2 或 3 (如果仍有问题)

---

## 📊 方案对比

| 方案 | Redis 减少 | 实施难度 | 功能影响 | 推荐度 |
|------|-----------|---------|---------|--------|
| **简化统计** | 70% | 低 | 小 | ⭐⭐⭐⭐⭐ |
| **Lua 脚本** | 50% | 中 | 无 | ⭐⭐⭐⭐ |
| **异步批量** | 90% | 高 | 中等 | ⭐⭐⭐ |
| **升级 Upstash** | - | 极低 | 无 | ⭐⭐⭐⭐⭐ |

---

## ⚠️ 重要说明

**统计数据的价值评估**:

当前系统记录了:
- ✅ **必需**: 总 token 数、总请求数、每日/月统计
- ⚠️ **可选**: 小时统计、分钟统计、按模型统计
- ❓ **过度**: 5分钟缓存 tokens、1小时缓存 tokens、长上下文请求详细统计

**建议**:
- 只保留核心统计 (每日/月)
- 按需启用详细统计 (开发/调试时)
- 生产环境关闭非必需统计

---

## 🔧 快速修复脚本

创建 `scripts/optimize-redis-usage.sh`:

```bash
#!/bin/bash

echo "🔧 优化 Redis 使用量..."

# 方案 1: 简化统计 (需要代码修改)
echo "📝 准备配置..."
cat >> .env.production << EOF
ENABLE_HOURLY_STATS=false
ENABLE_MINUTE_STATS=false
ENABLE_MODEL_STATS=false
ENABLE_DETAILED_CACHE_STATS=false
RATE_LIMIT_CLEANUP_INTERVAL=60
TOKEN_REFRESH_INTERVAL=60
EOF

echo "✅ 配置已更新，请重新部署服务"
echo "📊 预计 Redis 使用量减少 70%"
```

---

## 📚 相关文档

- [Upstash 配额问题](./UPSTASH_QUOTA_FIX.md)
- [Redis 优化指南](./REDIS_OPTIMIZATION.md)
- [Render 部署文档](./RENDER_UPSTASH_DEPLOYMENT.md)

---

**总结**: 问题的根本原因是**统计粒度过细**，每次 API 请求产生 140+ 次 Redis 操作。通过简化统计维度，可以减少 70% 的 Redis 使用量，或者升级 Upstash 到 Pro 计划以根本解决配额问题。
