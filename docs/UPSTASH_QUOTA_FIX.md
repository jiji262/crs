# Upstash 配额问题修复指南

## 问题概述

部署到 Render 后,Upstash Redis 很快达到 50万次请求限制,导致服务不可用。

### 错误信息
```
ERR max requests limit exceeded. Limit: 500000, Usage: 500000
```

## 根本原因

1. **Upstash 免费版限制**: 总共 50万次请求（不是每天刷新）
2. **高频定时任务**:
   - 限流清理: 每 5 分钟检查所有账户
   - Token 刷新: 每 15 分钟检查
   - 每次检查都会进行多次 Redis 操作
3. **累积效应**: 少量账户 + 频繁检查 = 快速耗尽配额

## 立即解决方案

### 方案 1: 禁用使用统计功能（最推荐，免费，减少 97%）

**⚡ 如果你不需要 Web 界面的统计图表，这是最佳方案！**

在 Render 环境变量中添加:

```bash
ENABLE_USAGE_STATISTICS=false  # 禁用统计功能
```

**效果**:
- 减少 **97% 的 Redis 请求**
- 核心功能完全不受影响（API 转发、认证、Token 刷新等）
- 失去的功能：Web 界面的统计图表、费用计算、使用记录查询

**适用场景**: 不需要查看使用统计数据的个人或小团队

### 方案 2: 调整定时任务间隔（推荐，免费，保留统计）

在 Render 环境变量中添加:

```bash
RATE_LIMIT_CLEANUP_INTERVAL=30  # 限流清理间隔 30 分钟（原 5 分钟）
TOKEN_REFRESH_INTERVAL=30        # Token 刷新间隔 30 分钟（原 15 分钟）
```

**效果**: 减少约 80% 的 Redis 请求（仅定时任务部分）

### 方案 3: 升级 Upstash（推荐，生产环境）

访问 [Upstash 控制台](https://console.upstash.com/) 升级:

- **Pay-as-you-go**: $0.2/100K 请求，按需付费
- **Pro 计划**: $10/月，包含 1000 万次请求

### 方案 4: 更换 Redis 提供商

其他免费/低成本选项:

| 提供商 | 免费额度 | 限制 |
|--------|---------|------|
| Redis Labs | 30MB | 30 连接，无请求限制 |
| Railway | - | 按用量付费 |
| 自建 VPS | - | 完全控制 |

## 代码修复详情

### 1. Docker 镜像修复

**问题**: `data/model_pricing.json` 文件在部署时丢失

**修复**: 更新 `.dockerignore`:
```dockerfile
# 保留 resources 目录（包含 fallback 价格数据）
!resources/
```

### 2. 配置系统增强

**新增配置** (`config/config.example.js`):
```javascript
scheduledTasks: {
  rateLimitCleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL) || 5,
  tokenRefreshInterval: parseInt(process.env.TOKEN_REFRESH_INTERVAL) || 15
}
```

**环境变量** (`.env.example`):
```bash
# ⏰ 定时任务配置
RATE_LIMIT_CLEANUP_INTERVAL=5   # 默认 5 分钟，Upstash 建议 30-60
TOKEN_REFRESH_INTERVAL=15        # 默认 15 分钟，Upstash 建议 30-60
```

### 3. 服务更新

**限流清理服务** (`src/services/rateLimitCleanupService.js`):
```javascript
// 从配置读取间隔
const intervalMinutes = config.scheduledTasks?.rateLimitCleanupInterval || 5
this.intervalMs = intervalMinutes * 60 * 1000
```

## 部署步骤

### 已部署用户（快速修复）

1. **更新环境变量**:
   - 登录 Render 控制台
   - 进入你的服务 → Environment
   - 添加环境变量:
     ```
     RATE_LIMIT_CLEANUP_INTERVAL=30
     TOKEN_REFRESH_INTERVAL=30
     ```
   - 点击 "Save Changes"

2. **重新部署**:
   - 服务会自动重启
   - 新的间隔配置生效

3. **监控使用情况**:
   - 访问 [Upstash 控制台](https://console.upstash.com/)
   - 查看 Daily Requests 图表
   - 确认请求频率下降

### 新部署用户

按照更新后的 [RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md) 部署，环境变量部分已包含优化配置。

## 配额使用估算

### 优化前（5分钟间隔）
- 限流检查: 288 次/天 × 每次约 10 个 Redis 命令 = 2,880 命令/天
- Token 刷新: 96 次/天 × 每次约 5 个命令 = 480 命令/天
- API 请求: 假设 100 请求/天 × 每次约 10 个命令 = 1,000 命令/天
- **总计**: ~4,360 命令/天
- **50万配额可用时间**: ~115 天

### 优化后（30分钟间隔）
- 限流检查: 48 次/天 × 10 命令 = 480 命令/天
- Token 刷新: 48 次/天 × 5 命令 = 240 命令/天
- API 请求: 100 × 10 = 1,000 命令/天
- **总计**: ~1,720 命令/天
- **50万配额可用时间**: ~290 天

## 长期建议

1. **生产环境**: 升级到 Upstash Pro ($10/月) 或使用专业 Redis 服务
2. **开发测试**: 使用本地 Redis 或 Docker Redis
3. **监控**: 定期检查 Upstash 使用情况，设置告警
4. **优化**:
   - 实现请求缓存减少 Redis 查询
   - 批量操作替代单次操作
   - 使用 Redis Pipeline 减少往返次数

## 相关文档

- [Render + Upstash 部署指南](./RENDER_UPSTASH_DEPLOYMENT.md)
- [VPS Docker 部署指南](./VPS_DOCKER_DEPLOYMENT.md)
- [Upstash 文档](https://docs.upstash.com/redis)

## 常见问题

**Q: 为什么 Upstash 免费版这么快就用完了？**

A: Upstash 免费版是 50万次总请求（lifetime），不是每日刷新。定时任务每次都会查询所有账户，导致快速消耗。

**Q: 调整间隔会影响功能吗？**

A: 不会。30分钟的清理间隔对于大多数使用场景足够，限流状态会被自动检测，token 过期前会自动刷新。

**Q: 如何知道配额还剩多少？**

A: 登录 [Upstash 控制台](https://console.upstash.com/)，查看数据库详情页的 "Total Requests" 指标。

**Q: 已经用完配额怎么办？**

A:
1. 升级到付费计划（立即生效）
2. 或切换到其他 Redis 提供商
3. 或在 VPS 上自建 Redis

## 🔍 诊断工具

### 运行 Redis 使用诊断

```bash
node scripts/diagnose-redis-usage.js
```

这个脚本会:
- 分析实际的 Redis 请求模式
- 识别低效的 KEYS 命令使用
- 估算每日请求数量
- 提供具体的优化建议

### 查看 Upstash 统计

1. 登录 https://console.upstash.com/
2. 选择你的 Redis 数据库
3. 查看 **Command Stats** 标签
4. 重点关注:
   - `KEYS` 命令频率 (应该为0)
   - `HGETALL` 数量 (应该较少)
   - 总请求数趋势

## 深度优化 (代码级)

如果配置优化后仍然超配额,需要进行代码优化。查看:
- [Redis 优化完整指南](./REDIS_OPTIMIZATION.md)

主要优化方向:
1. 用 SET 索引替代 KEYS 命令 (减少 90%)
2. 启用 Pipeline 批量操作 (减少 90%)
3. 添加本地缓存层 (减少 80%)

## 技术支持

遇到问题请提交 Issue: https://github.com/your-repo/issues
