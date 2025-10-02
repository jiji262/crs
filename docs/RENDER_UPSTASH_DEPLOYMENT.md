# Claude Relay Service - Render + Upstash Docker 部署指南

本指南详细说明如何使用 Docker + Render.com（免费/付费Web服务）和 Upstash Redis（免费层）部署 Claude Relay Service。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [📋 前置准备](#-前置准备)
- [🐳 Docker 部署步骤](#-docker-部署步骤)
  - [第一步：创建 Upstash Redis](#第一步创建-upstash-redis-数据库)
  - [第二步：部署到 Render](#第二步在-render-部署-docker-服务)
  - [第三步：验证部署](#第三步验证部署)
  - [第四步：访问和配置](#第四步访问和配置服务)
- [🔄 自动更新配置](#-自动更新配置)
- [🔋 保活配置](#-保活配置免费计划必读)
  - [方式一：Better Stack](#方式一better-stack-监控推荐)
  - [方式二：UptimeRobot](#方式二uptimerobot备选)
  - [方式三：升级付费](#方式三升级到付费计划最佳解决方案)
- [🔧 配置客户端](#-配置客户端)
- [🎯 生产环境优化](#-生产环境优化)
- [🐛 故障排查](#-故障排查)
- [✅ 部署检查清单](#-部署检查清单)

---

## 🚀 快速开始

**部署方式**：Docker 容器部署
**更新方式**：Render Auto-Deploy 自动更新

**预计时间**：10-15分钟

**前置要求**：

- Render 账号（免费注册）
- Upstash 账号（免费注册）

**核心优势**：

- ✅ **快速部署**：1-2分钟完成部署
- ✅ **自动更新**：Render Auto-Deploy 自动拉取新镜像
- ✅ **环境一致**：Docker 容器确保完全一致的运行环境
- ✅ **零停机更新**：滚动更新，无需手动操作
- ✅ **免费保活**：Better Stack 监控防止休眠

---

## 📋 前置准备

### 1. 注册账号

**Render.com 账号**

- 访问：https://render.com/
- 点击 "Get Started" 注册账号
- 可使用 GitHub/GitLab 账号快速登录
- 免费计划包含：750小时/月的免费服务时间

**Upstash Redis 账号**

- 访问：https://upstash.com/
- 点击 "Sign Up" 注册账号
- 可使用 GitHub/Google 账号快速登录
- 免费计划包含：10,000条命令/天，256MB存储

**GitHub 账号**（用于代码托管）

- 访问：https://github.com/
- 如已有账号可跳过

### 2. 费用说明

**免费方案组合**

- Render Free Plan：$0/月（有限制：服务15分钟无活动会休眠，重启需30-60秒）
- Upstash Free Plan：$0/月（10K命令/天，对小团队足够）
- **总计：$0/月**

**推荐付费方案**（生产环境）

- Render Starter Plan：$7/月（无休眠，更快速度，更多资源）
- Upstash Pay-as-you-go：$0.2/100K命令（按需付费）
- **总计：约$7-10/月**

---

## 🐳 Docker 部署步骤

### 第一步：创建 Upstash Redis 数据库

#### 1.1 登录 Upstash 控制台

1. 访问：https://console.upstash.com/
2. 使用你的账号登录

#### 1.2 创建 Redis 数据库

1. 点击 "Create Database" 按钮
2. 填写配置信息：
   - **Name**: `claude-relay-redis`（或其他你喜欢的名称）
   - **Type**: 选择 `Regional`（区域性数据库，免费）
   - **Region**: 选择离你最近的区域（推荐 `us-east-1` 或 `ap-southeast-1`）
   - **Eviction**: 选择 `noeviction`（不自动清除数据）
   - **TLS**: 保持启用（默认）

3. 点击 "Create" 创建数据库

#### 1.3 获取连接信息

创建完成后，在数据库详情页面找到以下信息：

```
📋 复制以下信息，稍后需要使用：

Endpoint: redis-xxxxx.upstash.io
Port: 6379 或 xxxxx（可能是自定义端口）
Password: your-upstash-redis-password
```

**重要提示**：

- Upstash 使用 TLS 加密连接（RedisS）
- 记录完整的连接字符串，格式类似：`rediss://:password@endpoint:port`

---

### 第二步：在 Render 部署 Docker 服务

#### 2.1 登录 Render 控制台

访问：https://dashboard.render.com/ 并登录

#### 2.2 创建新的 Web Service

1. 点击 "New +" 按钮
2. 选择 "Web Service"
3. **选择 "Deploy an existing image from a registry"**

#### 2.3 配置 Docker 服务

**基础配置**

| 配置项        | 值                                    | 说明             |
| ------------- | ------------------------------------- | ---------------- |
| **Image URL** | `weishaw/claude-relay-service:latest` | 官方 Docker 镜像 |
| **Name**      | `claude-relay-service`                | 服务名称         |
| **Region**    | `Oregon (US West)`                    | 选择区域         |
| **Plan**      | `Free` 或 `Starter`                   | 选择计划         |

**Docker 特定配置**

- **Image URL**: `weishaw/claude-relay-service:latest`
- **Auto-Deploy**: `Yes`（启用后自动拉取新镜像）
- **Health Check Path**: `/health`

#### 2.4 配置环境变量

在 "Environment Variables" 部分，点击 "Add Environment Variable" 添加以下变量：

**必填环境变量**

```bash
# 🔐 安全密钥（必填 - 已预生成，可直接使用）
JWT_SECRET=de43c2bbbc4f15cf1a4997d245fbfd3287b3be28eb04c4239f147ac38be6066c9fcb7f5c756d4aebe5103bbee4d95e44c30c3d95d7e402163451cde9450b16f1
ENCRYPTION_KEY=7017c4a38e9dcd3720889cbd2ec8b51728c8ab118b525e77e69351ecc1ee465b

# 📊 Redis 配置（必填 - 从 Upstash 获取）
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-redis-password
REDIS_ENABLE_TLS=true

# 🌐 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 👤 管理员凭据（必填 - 自定义设置）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Zteshno@0
```

**⚠️ 关于配置的重要说明**：

1. **安全密钥**：
   - 上面提供的 JWT_SECRET 和 ENCRYPTION_KEY 已经是安全随机生成的密钥
   - 可以直接使用，或使用以下命令重新生成：

     ```bash
     # 重新生成 JWT_SECRET
     openssl rand -hex 64

     # 重新生成 ENCRYPTION_KEY
     openssl rand -hex 32
     ```

   - ⚠️ **部署后不要更改密钥**，否则已有数据无法解密

2. **数据持久化**：
   - Render 不持久化本地文件（如 `data/init.json`）
   - 必须设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 环境变量
   - 所有业务数据（API Keys、Claude 账户）存储在 Upstash Redis（持久化）

**可选环境变量**（根据需求添加）

```bash
# 📊 使用统计配置（⚠️ 重要：针对 Upstash 免费配额）
# ⚠️ 如果不需要 Web 界面的统计功能，强烈建议禁用以节省 97% Redis 使用量
# 禁用后核心功能不受影响，只是失去统计图表和费用计算功能
ENABLE_USAGE_STATISTICS=false  # 设置为 false 可减少 97% Redis 请求数

# ⏰ 定时任务优化（针对 Upstash 免费配额）
# ⚠️ Upstash 免费版总共有 50万 次请求限制，用完后需升级
# 定时任务会频繁查询 Redis，建议调整间隔以节省配额
RATE_LIMIT_CLEANUP_INTERVAL=30  # 限流清理间隔（分钟），免费版建议 30-60
TOKEN_REFRESH_INTERVAL=30        # Token 刷新间隔（分钟），免费版建议 30-60

# 📝 日志配置
LOG_LEVEL=info

# ⏱️ 超时配置
REQUEST_TIMEOUT=600000

# 🛠️ 系统配置
TIMEZONE_OFFSET=8
TRUST_PROXY=true
```

#### 2.5 创建并部署

1. 检查所有配置是否正确
2. 点击 "Create Web Service"
3. Render 会自动拉取 Docker 镜像并启动（约1-2分钟）

---

### 第三步：验证部署

#### 3.1 查看部署状态

等待状态变为 "Live"，在部署页面可以看到：

- **Logs**：实时运行日志
- **Events**：部署事件记录
- **Settings**：服务配置

#### 3.2 查看初始化日志

在 "Logs" 标签查找类似内容：

```
🚀 Claude Relay Service 启动中...
✅ 环境配置已就绪
📋 首次启动，执行初始化设置...
📌 检测到预设的管理员凭据
✅ 初始化完成
🌐 启动 Claude Relay Service...
```

#### 3.3 管理员凭据

由于设置了环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`：

- **用户名**：你设置的 `ADMIN_USERNAME` 值（如 `cr_admin`）
- **密码**：你设置的 `ADMIN_PASSWORD` 值

**⚠️ 重要**：

- Render 不持久化本地文件，每次重启都会重新初始化
- 必须通过环境变量固定管理员凭据，否则每次重启凭据会变化
- 所有业务数据（API Keys、Claude 账户）都存储在 Upstash Redis，不会丢失

---

### 第四步：访问和配置服务

#### 4.1 获取服务 URL

在 Render 服务详情页面顶部，复制你的服务 URL：

```
https://claude-relay-service-xxxx.onrender.com
```

#### 4.2 访问管理界面

1. 在浏览器中打开：`https://你的服务URL/web`
2. 使用管理员凭据登录
3. 首次登录后建议修改管理员密码

#### 4.3 添加 Claude 账户

参考主 README.md 中的 "添加Claude账户" 部分：

1. 点击「Claude账户」标签
2. 配置代理（如需要）
3. 点击「添加账户」
4. 生成 OAuth 授权链接并完成授权
5. 复制 Authorization Code 并粘贴到页面

**注意**：OAuth 授权过程可能需要科学上网。

#### 4.4 创建 API Key

1. 点击「API Keys」标签
2. 点击「创建新Key」
3. 设置名称和限制
4. 保存并记录生成的 API Key

---

## 🔄 自动更新配置

### 方式一：Render Auto-Deploy（推荐）

Render 内置的自动部署功能，适合大多数场景。

#### 启用 Auto-Deploy

在 Render 服务设置中：

1. 找到 "Auto-Deploy" 选项
2. 确保设置为 "Yes"
3. Render 会定期检查 Docker Hub 上的新镜像

#### 更新流程

**自动更新**：

1. 项目发布新 Docker 镜像到 Docker Hub
2. Render 自动检测到新镜像（通常几分钟内）
3. 自动拉取并重新部署（约1-2分钟）
4. 零停机滚动更新

**手动触发更新**：

1. 访问 Render 服务详情页
2. 点击 "Manual Deploy" → "Deploy latest commit"
3. 或点击 "Clear build cache & deploy"（强制重新拉取镜像）

#### 版本管理

**使用 latest 标签（推荐）**：

```
Image URL: weishaw/claude-relay-service:latest
```

自动跟随最新版本

**使用特定版本**：

```
Image URL: weishaw/claude-relay-service:v1.1.160
```

固定版本，需要手动更新镜像URL

**版本回滚**：

1. 在 Render 控制台找到 "Events" 标签
2. 找到之前的成功部署
3. 点击 "Rollback" 回滚到该版本

---

## 🔋 保活配置（免费计划必读）

### 为什么需要保活？

#### Render 免费计划的休眠机制

**休眠规则**：

- ⏰ **15分钟无活动自动休眠**
- 🐌 **冷启动时间：30-50秒**
- ✅ **月配额：750小时（足够全月运行）**

**影响**：

- 首次请求需要等待30-50秒唤醒
- 影响用户体验，不适合需要即时响应的场景

#### Upstash 免费计划

**无需保活**：

- ✅ **数据持久化**：自动持久化到块存储，永不丢失
- ✅ **始终在线**：Redis 服务不会休眠
- ✅ **免费配额**：500K 命令/月，256MB 存储

---

### 方式一：Better Stack 监控（推荐）

Better Stack 提供免费的 Uptime Monitoring，功能强大且易用。

#### 优势

- ✅ **免费计划**：10个监控项，每30秒检查一次
- ✅ **全球节点**：多个监控节点，更可靠
- ✅ **告警通知**：邮件、Slack、Webhook 等
- ✅ **状态页面**：自动生成公开状态页
- ✅ **统计分析**：响应时间、可用性统计

#### 配置步骤

**1. 注册 Better Stack**

访问：https://betterstack.com/

- 点击 "Start for free"
- 使用 GitHub/Google 账号快速注册
- 免费计划包含 10 个监控项

**2. 创建 Uptime Monitor**

1. 登录后进入 "Uptime" 页面
2. 点击 "Add Monitor"
3. 填写监控配置：

```
Monitor Type: HTTP(S)
URL: https://你的服务URL/health
Name: Claude Relay Service
Check Frequency: 30 seconds（免费计划）
Request Timeout: 30 seconds
Request Method: GET
Expected Status Code: 200
```

**3. 配置告警（可选）**

1. 在 Monitor 设置中找到 "Incidents"
2. 配置告警规则：
   - **Email**：发送到你的邮箱
   - **Slack**：集成 Slack Webhook
   - **Webhook**：自定义 Webhook URL

3. 设置告警条件：
   ```
   Alert when: Monitor is down
   Grace Period: 1 minute（避免误报）
   ```

**4. 验证保活效果**

1. 查看 Monitor 页面，确认状态为 "Up"
2. 检查响应时间图表
3. 等待15分钟后，查看服务是否保持唤醒状态

#### Better Stack 配置示例

**基础监控配置**：

```yaml
监控名称: Claude Relay Service - Health Check
URL: https://claude-relay-service-xxxx.onrender.com/health
检查频率: 30秒
超时时间: 30秒
预期状态码: 200
监控区域: 选择最近的区域（如 US West）
```

**高级配置**：

```yaml
# 自定义 HTTP Headers（如需要）
Headers:
  User-Agent: BetterStack-Monitor

# SSL 证书监控
SSL Certificate: 启用
Alert before expiry: 30天

# 响应时间告警
Performance Degradation: 启用
Alert when response time > 5000ms
```

---

### 方式二：UptimeRobot（备选）

UptimeRobot 是另一个流行的免费监控服务。

#### 优势

- ✅ **免费计划**：50个监控项
- ✅ **5分钟检查间隔**（免费计划）
- ✅ **邮件告警**
- ⚠️ **功能较基础**

#### 快速配置

1. 访问：https://uptimerobot.com/
2. 注册并登录
3. 点击 "+ Add New Monitor"
4. 填写配置：
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Claude Relay Service
   URL: https://你的服务URL/health
   Monitoring Interval: 5 minutes
   ```
5. 点击 "Create Monitor"

---

### 方式三：自建保活脚本（不推荐）

**方式A：使用 GitHub Actions**

创建 `.github/workflows/keep-alive.yml`：

```yaml
name: Keep Render Service Alive

on:
  schedule:
    # 每10分钟运行一次
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Health Endpoint
        run: |
          curl -f https://你的服务URL/health || exit 0
```

**方式B：使用 Cron Job（需要服务器）**

在你的服务器上创建 cron job：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每10分钟ping一次）
*/10 * * * * curl -f https://你的服务URL/health > /dev/null 2>&1
```

**⚠️ 不推荐原因**：

- GitHub Actions 有使用限制
- 需要额外维护
- 不如专业监控服务可靠

---

### 方式四：升级到付费计划（最佳解决方案）

如果预算允许，升级到 Render Starter 计划是最佳选择。

#### Render Starter Plan ($7/月)

**优势**：

- ✅ **无休眠**：服务始终在线，无冷启动
- ✅ **更多资源**：512 MB RAM, 0.5 CPU
- ✅ **更快响应**：无需唤醒时间
- ✅ **更高可用性**：99.9% SLA

**升级步骤**：

1. 在 Render 服务设置中找到 "Instance Type"
2. 选择 "Starter" 计划
3. 确认升级，立即生效

**成本对比**：

```
免费计划 + Better Stack: $0/月（有冷启动）
付费计划: $7/月（无冷启动，更稳定）
```

**推荐场景**：

- 🏢 **生产环境**：推荐付费计划
- 🧪 **测试环境**：免费计划 + Better Stack
- 👥 **小团队共享**：付费计划（$7/3人 = $2.33/人）

---

### 保活方案对比

| 方案               | 成本    | 可靠性     | 配置难度 | 推荐度      |
| ------------------ | ------- | ---------- | -------- | ----------- |
| **Better Stack**   | 免费    | ⭐⭐⭐⭐⭐ | 简单     | 🏆 强烈推荐 |
| **UptimeRobot**    | 免费    | ⭐⭐⭐⭐   | 简单     | ✅ 推荐     |
| **GitHub Actions** | 免费    | ⭐⭐⭐     | 中等     | ⚠️ 不推荐   |
| **Cron Job**       | VPS费用 | ⭐⭐⭐⭐   | 中等     | ⚠️ 不推荐   |
| **升级付费计划**   | $7/月   | ⭐⭐⭐⭐⭐ | 无需配置 | 🏆 最佳方案 |

---

### 保活配置检查清单

- [ ] 了解 Render 免费计划的休眠机制（15分钟）
- [ ] 确认 Upstash 无需保活（数据持久化）
- [ ] 选择保活方案（Better Stack 推荐）
- [ ] 注册 Better Stack 账号
- [ ] 创建 Uptime Monitor（/health 端点）
- [ ] 配置检查频率（30秒）
- [ ] 设置告警通知（邮件/Slack）
- [ ] 验证保活效果（等待15分钟测试）
- [ ] 监控响应时间和可用性
- [ ] （可选）考虑升级到付费计划

---

### 常见问题

**Q1: Better Stack 免费计划有什么限制？**

A: 免费计划包含：

- 10个监控项（足够使用）
- 30秒检查间隔
- 邮件告警
- 1个公开状态页
- 7天数据保留

**Q2: 使用保活服务会超出 Render 免费配额吗？**

A: 不会。计算如下：

```
每小时请求数: 3600秒 / 30秒 = 120次
每天请求数: 120 * 24 = 2,880次
每月运行时间: 24小时 * 30天 = 720小时
Render 配额: 750小时

结论：不会超出免费配额
```

**Q3: 保活会影响服务性能吗？**

A: 不会。/health 端点非常轻量，只返回服务状态，对性能影响可忽略不计。

**Q4: 如果 Better Stack 检测到服务宕机怎么办？**

A: Better Stack 会：

1. 立即发送告警通知
2. 记录宕机时间和原因
3. 生成可用性报告
4. 在状态页显示事件

你应该：

1. 查看 Render 日志排查问题
2. 检查服务健康状态
3. 必要时重启服务

**Q5: 可以同时使用多个保活服务吗？**

A: 可以，但不推荐。多个服务同时ping可能：

- 增加服务器负载（虽然很小）
- 产生重复告警
- 建议选择一个可靠的服务即可

---

## 🔧 配置客户端

### Claude Code 配置

```bash
# 设置环境变量
export ANTHROPIC_BASE_URL="https://你的服务URL/api/"
export ANTHROPIC_AUTH_TOKEN="你的API密钥"

# 测试连接
claude "Hello, test connection"
```

### VSCode Claude 插件配置

编辑 `~/.claude/config.json`：

```json
{
  "primaryApiKey": "crs",
  "baseURL": "https://你的服务URL/api/"
}
```

### Gemini CLI 配置

```bash
export CODE_ASSIST_ENDPOINT="https://你的服务URL/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

### Codex CLI 配置

编辑 `~/.codex/config.toml`：

```toml
model_provider = "crs"
model = "gpt-5-codex"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.crs]
name = "crs"
base_url = "https://你的服务URL/openai"
wire_api = "responses"
requires_openai_auth = true
env_key = "CRS_OAI_KEY"
```

环境变量：

```bash
export CRS_OAI_KEY="你的API密钥"
```

---

## 🎯 生产环境优化

### 1. 自定义域名（可选）

#### 1.1 在 Render 添加自定义域名

1. 在服务设置页面，找到 "Custom Domains"
2. 点击 "Add Custom Domain"
3. 输入你的域名，例如：`api.yourdomain.com`
4. Render 会提供 CNAME 记录

#### 1.2 配置 DNS

在你的域名提供商（如 Cloudflare、阿里云）配置 DNS：

```
类型: CNAME
名称: api (或你的子域名)
值: <Render提供的CNAME值>
TTL: 自动或300秒
```

#### 1.3 启用 SSL

Render 自动为自定义域名提供免费 SSL 证书（Let's Encrypt）。

### 2. 升级到付费计划

**推荐场景**：

- 生产环境使用
- 需要稳定的响应时间
- 多用户并发使用

**Render Starter Plan 优势**：

- 无休眠时间，服务始终在线
- 更多 CPU 和内存资源
- 更好的网络性能
- 支持自定义健康检查

**升级步骤**：

1. 在服务设置中找到 "Instance Type"
2. 选择 "Starter" 计划
3. 确认升级，立即生效

### 3. 监控和告警

#### 3.1 启用健康检查

在 Render 服务设置中：

- **Health Check Path**: `/health`
- **Health Check Interval**: `60` 秒

#### 3.2 查看服务指标

在 Render 控制台可以查看：

- CPU 使用率
- 内存使用率
- 网络流量
- 请求响应时间

#### 3.3 配置告警（付费计划）

Render 付费计划支持：

- 邮件告警
- Webhook 告警
- Slack 集成

### 4. 数据备份

#### 4.1 Upstash 数据导出

定期导出 Redis 数据：

```bash
# 使用 redis-cli 连接 Upstash
redis-cli -h your-upstash-endpoint -p port -a password --tls

# 导出所有键
KEYS *

# 手动备份重要数据
# （建议编写自动化脚本）
```

#### 4.2 配置文件备份

备份以下内容到安全位置：

- `.env` 配置
- `data/init.json`（管理员凭据）
- API Keys 列表

---

## 🐛 故障排查

### 部署失败

**症状**：构建或部署过程失败

**解决方法**：

1. 检查 Render Logs 查看错误信息
2. 确认环境变量配置正确
3. 验证 Redis 连接信息
4. 尝试手动触发重新部署（Deploy → Manual Deploy）

**常见错误**：

```
Error: Redis connection failed
→ 检查 REDIS_HOST, REDIS_PORT, REDIS_PASSWORD 是否正确
→ 确认 REDIS_ENABLE_TLS=true 已设置
```

```
Error: JWT_SECRET or ENCRYPTION_KEY is not set
→ 确认环境变量已正确设置
→ 密钥长度必须符合要求（JWT_SECRET>=32字符，ENCRYPTION_KEY=64字符）
```

### 服务无响应（免费计划）

**症状**：访问服务15分钟后无响应，需要30-60秒唤醒

**解决方法**：

- 方案1：升级到 Starter 付费计划（推荐）
- 方案2：使用外部监控服务定期ping服务（如 UptimeRobot）
- 方案3：在使用前等待服务唤醒

### Redis 连接问题

**症状**：服务无法连接到 Upstash Redis

**解决方法**：

1. 验证 Redis 连接信息：
   ```bash
   # 本地测试连接
   redis-cli -h your-endpoint -p port -a password --tls
   ```
2. 检查 Upstash 控制台确认数据库状态
3. 确认 `REDIS_ENABLE_TLS=true` 已设置
4. 检查 Render 日志中的详细错误信息

### Upstash 请求配额耗尽

**症状**：

```
ERR max requests limit exceeded. Limit: 500000, Usage: 500000
```

**原因分析**：
Upstash 免费版有 **50万次总请求限制**（不是每天，而是账户总限制）。以下操作会消耗配额：

- 定时任务每 5 分钟检查一次限流状态（每次查询所有账户）
- Token 自动刷新检查（每 15 分钟）
- 每次 API 请求的验证、统计、日志记录

**解决方法**：

1. **调整定时任务间隔**（推荐）：

   ```bash
   # 在 Render 环境变量中添加：
   RATE_LIMIT_CLEANUP_INTERVAL=30  # 从 5 分钟改为 30 分钟
   TOKEN_REFRESH_INTERVAL=30        # 从 15 分钟改为 30 分钟
   ```

2. **升级 Upstash 计划**：
   - 访问 Upstash 控制台升级到付费计划
   - Pay-as-you-go: $0.2/100K 请求
   - Pro 计划: $10/月，包含 1000 万次请求

3. **更换 Redis 提供商**：
   - Redis Labs (500MB 免费，无请求限制)
   - Railway (按用量付费)
   - 自建 Redis（VPS 部署）

### OAuth 授权失败

**症状**：添加 Claude 账户时 OAuth 授权失败

**解决方法**：

1. 确认能访问 claude.ai
2. 使用代理配置（如果在国内）
3. 清除浏览器缓存和 Cookie 重试
4. 检查授权链接是否过期（有效期15分钟）

### API 请求失败

**症状**：客户端无法成功调用 API

**解决方法**：

1. 验证 API Key 格式（应为 `cr_` 前缀）
2. 检查 Claude 账户状态是否正常
3. 查看服务日志获取详细错误
4. 测试健康检查端点：`curl https://你的服务URL/health`

---

## 📊 使用监控

### 查看使用统计

1. 登录管理界面
2. 访问「仪表板」查看：
   - 总请求数
   - Token 使用量
   - 账户状态
   - API Key 使用情况

### 查看日志

**Render 日志**：

- 在 Render 控制台 → Logs 标签
- 实时查看服务运行日志

**应用日志**：

- 在管理界面 → 系统日志
- 查看应用级别的详细日志

---

## 🔒 安全建议

### 1. 密钥管理

- ✅ 使用强随机密钥（JWT_SECRET, ENCRYPTION_KEY）
- ✅ 定期轮换管理员密码
- ✅ 不要在代码中硬编码密钥
- ✅ 使用环境变量存储敏感信息

### 2. 网络安全

- ✅ 启用 HTTPS（Render 默认启用）
- ✅ 使用自定义域名（可选）
- ✅ 配置 IP 白名单（如需要）
- ✅ 定期检查访问日志

### 3. 访问控制

- ✅ 为每个用户创建独立 API Key
- ✅ 设置合理的使用限制
- ✅ 启用客户端限制（如需要）
- ✅ 定期审查和清理不活跃的 API Key

### 4. 数据保护

- ✅ 定期备份 Redis 数据
- ✅ 启用 Redis TLS 加密（Upstash 默认启用）
- ✅ 监控异常访问模式
- ✅ 遵守数据保留政策

---

## 💰 成本优化建议

### 免费方案限制

**Render Free Plan**：

- ✅ 750小时/月免费时间（足够单个服务全天运行）
- ⚠️ 15分钟无活动自动休眠
- ⚠️ 有限的 CPU 和内存资源
- ⚠️ 较慢的启动速度

**Upstash Free Plan**：

- ✅ 10,000条命令/天
- ✅ 256MB 存储空间
- ⚠️ 对于2-5人小团队足够，超出需升级

### 成本估算

**小团队（2-5人）**：

- Render Free + Upstash Free = $0/月
- 可能遇到性能和休眠问题

**中型团队（5-10人）**：

- Render Starter ($7/月) + Upstash Free = $7/月
- 推荐配置，性能稳定

**大型团队（10+人）**：

- Render Standard ($25/月) + Upstash Pay-as-you-go ($5-10/月) = $30-35/月
- 更高性能和可靠性

---

## 🔄 维护和更新

### 手动更新

当项目有新版本时：

1. **更新你的 Fork**：

   ```bash
   # 添加上游仓库（首次）
   git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git

   # 拉取上游更新
   git fetch upstream
   git checkout main
   git merge upstream/main

   # 推送到你的 Fork
   git push origin main
   ```

2. **Render 自动部署**：
   - 如果启用了 Auto-Deploy，Render 会自动检测并部署
   - 否则，在 Render 控制台手动触发部署

### 自动更新（GitHub Actions）

可以配置 GitHub Actions 自动同步上游更新（高级用户）。

---

## 📚 参考资源

- **项目仓库**：https://github.com/Wei-Shaw/claude-relay-service
- **Render 文档**：https://render.com/docs
- **Upstash 文档**：https://docs.upstash.com/
- **Claude API 文档**：https://docs.anthropic.com/

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：Render Logs 和应用日志
2. **阅读文档**：本文档和主 README.md
3. **提交 Issue**：https://github.com/Wei-Shaw/claude-relay-service/issues
4. **社区讨论**：Telegram 公告频道

---

## ✅ 部署检查清单

### Render + Upstash 部署

**基础部署**：

- [ ] Upstash Redis 数据库已创建并获取连接信息
- [ ] 密钥已生成（JWT_SECRET, ENCRYPTION_KEY）
- [ ] Render Web Service 已创建（Docker 镜像部署）
- [ ] Docker 镜像 URL 配置：`weishaw/claude-relay-service:latest`
- [ ] 环境变量已配置（JWT*SECRET, ENCRYPTION_KEY, REDIS*_, ADMIN\__）
- [ ] Auto-Deploy 已启用（自动拉取新镜像）
- [ ] Health Check Path 配置：`/health`
- [ ] 服务已成功部署并状态为 "Live"（1-2分钟）

**服务配置**：

- [ ] 可以访问管理界面（`/web`）
- [ ] 管理员凭据已保存到密码管理器
- [ ] 已添加至少一个 Claude 账户
- [ ] 已创建至少一个 API Key
- [ ] 客户端配置完成并测试连接成功
- [ ] 健康检查端点（`/health`）返回正常

**保活配置（免费计划）**：

- [ ] 已注册 Better Stack 账号
- [ ] 已创建 Uptime Monitor（30秒检查间隔）
- [ ] 监控 URL 配置：`https://你的服务URL/health`
- [ ] 告警通知已配置（邮件/Slack）
- [ ] 已验证保活效果（等待15分钟测试）
- [ ] 响应时间监控正常
- [ ] （可选）已升级到 Starter 付费计划

**备份和维护**：

- [ ] 自动更新已配置（Render Auto-Deploy）
- [ ] 已备份重要配置和凭据

### Watchtower + Upstash 部署（可选）

- [ ] VPS 服务器已准备（1核1GB以上）
- [ ] Docker 和 Docker Compose 已安装
- [ ] Upstash Redis 数据库已创建并获取连接信息
- [ ] 密钥已生成（JWT_SECRET, ENCRYPTION_KEY）
- [ ] docker-compose.yml 文件已配置
- [ ] 环境变量已填入配置文件
- [ ] Watchtower 检查间隔已设置（推荐1小时）
- [ ] 容器标签已配置（watchtower.enable=true）
- [ ] 服务已启动（docker-compose up -d）
- [ ] Claude Relay Service 运行正常
- [ ] Watchtower 运行正常
- [ ] 可以访问管理界面（http://IP:3000/web）
- [ ] 管理员凭据已保存到密码管理器
- [ ] 已添加至少一个 Claude 账户
- [ ] 已创建至少一个 API Key
- [ ] 客户端配置完成并测试连接成功
- [ ] 健康检查端点（`/health`）返回正常
- [ ] 自动更新已测试（可选）
- [ ] 更新通知已配置（可选）
- [ ] 已备份重要配置和凭据

---

**🎉 恭喜！你已成功部署 Claude Relay Service 到 Render + Upstash！**

现在可以开始使用 Claude Code、Gemini CLI、Codex 等工具了。
