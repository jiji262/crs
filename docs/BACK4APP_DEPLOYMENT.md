# Claude Relay Service - Back4app + Redis 部署指南

本指南详细说明如何使用 Back4app Containers（免费，**不需要信用卡**）和免费 Redis 部署 Claude Relay Service。

> **💡 Redis 选择建议**：推荐使用 **Aiven for Valkey**（1GB 内存，无请求限制），比 Upstash 更适合长期使用。详见 [Aiven 迁移指南](./AIVEN_MIGRATION.md)。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [📋 前置准备](#-前置准备)
- [🐳 部署步骤](#-部署步骤)
  - [第一步：创建 Upstash Redis](#第一步创建-upstash-redis-数据库)
  - [第二步：准备 GitHub 仓库](#第二步准备-github-仓库)
  - [第三步：部署到 Back4app](#第三步部署到-back4app)
  - [第四步：验证部署](#第四步验证部署)
- [🔋 保活测试](#-保活测试)
- [🔧 配置客户端](#-配置客户端)
- [🐛 故障排查](#-故障排查)
- [✅ 部署检查清单](#-部署检查清单)

---

## 🚀 快速开始

**部署方式**：Docker 容器部署（基于 GitHub 仓库）
**更新方式**：GitHub 推送自动部署

**预计时间**：15-20分钟

**⚠️ 重要限制**：
- ❌ **默认域名仅 60 分钟有效**：免费套餐的 `.b4a.run` 域名是临时的
- ❌ **自定义域名需要付费**：需要升级到 Shared Plan ($5/月)
- ⚠️ **不推荐用于长期部署**：除非升级到付费套餐

**核心优势**：
- ✅ **完全免费**：不需要信用卡（但域名临时）
- ✅ **自动部署**：GitHub 推送自动触发部署
- ✅ **Docker 支持**：完整的 Docker 环境
- ✅ **GitHub 集成**：无缝集成 GitHub 仓库
- ⚠️ **资源有限**：256MB RAM（比 Render 少，但可能足够）

**前置要求**：
- Back4app 账号（免费注册，不需要信用卡）
- Redis 数据库（选择一个）：
  - **推荐：Aiven for Valkey**（1GB 内存，无请求限制，永久免费）
  - 或：Upstash Redis（250MB 内存，50万次/天请求限制）
- GitHub 账号（代码托管）
- **如需长期使用：准备升级到付费套餐或使用其他平台**

---

## 📋 前置准备

### 1. 注册账号

**Back4app 账号**
- 访问：https://www.back4app.com/
- 点击 "Sign Up" 注册账号
- 可使用 GitHub/Google 账号快速登录
- ✅ **免费计划无需信用卡**

**Redis 数据库（二选一）**

**方案 1：Aiven for Valkey（推荐）⭐**
- 访问：https://aiven.io/
- 点击 "Start free" 注册账号
- 免费计划：**1GB 内存，5GB 存储，无请求限制**
- **优势**：4倍内存，无请求次数限制，独立虚拟机
- 详细教程：查看 [Aiven 迁移指南](./AIVEN_MIGRATION.md)

**方案 2：Upstash Redis**
- 访问：https://upstash.com/
- 点击 "Sign Up" 注册账号
- 免费计划：250MB 内存，50万次/天请求
- **限制**：请求配额易超限（约 5.8 次/秒）

**GitHub 账号**
- 访问：https://github.com/
- 如已有账号可跳过

### 2. 费用说明

**完全免费方案**
- Back4app Free Plan：$0/月（0.25 CPU, 256MB RAM, 100GB 流量）
- Upstash Free Plan：$0/月（500K 命令/月，256MB 存储）
- **总计：$0/月（无需信用卡）**

**资源对比**：

| 平台 | CPU | RAM | 流量 | 需要绑卡 | 休眠 |
|------|-----|-----|------|---------|------|
| Back4app | 0.25 | 256MB | 100GB | ❌ 否 | ❓ 待测试 |
| Render | 0.5 | 512MB | 100GB | ✅ 是 | ✅ 15分钟 |
| Hugging Face | 变动 | 变动 | 无限 | ❌ 否 | ⚠️ 可能 |

---

## 🐳 部署步骤

### 第一步：创建 Upstash Redis 数据库

#### 1.1 登录 Upstash 控制台

1. 访问：https://console.upstash.com/
2. 使用你的账号登录

#### 1.2 创建 Redis 数据库

1. 点击 "Create Database" 按钮
2. 填写配置信息：
   - **Name**: `claude-relay-redis`（或其他你喜欢的名称）
   - **Type**: 选择 `Regional`（区域性数据库，免费）
   - **Region**: 选择离你最近的区域
     - 如果在国内：建议 `ap-southeast-1` (新加坡)
     - 如果在美国：建议 `us-east-1` (弗吉尼亚)
   - **Eviction**: 选择 `noeviction`（不自动清除数据）
   - **TLS**: 保持启用（默认）

3. 点击 "Create" 创建数据库

#### 1.3 获取连接信息

创建完成后，在数据库详情页面找到以下信息：

```
📋 复制以下信息，稍后需要使用：

Endpoint: your-endpoint.upstash.io
Port: 6379（或自定义端口）
Password: your-upstash-redis-password
```

**重要提示**：
- Upstash 使用 TLS 加密连接
- 记录完整的连接信息，稍后配置环境变量时使用

---

### 第二步：准备 GitHub 仓库

#### 2.1 Fork 项目（推荐）

如果你想保持与官方项目同步：

1. 访问：https://github.com/Wei-Shaw/claude-relay-service
2. 点击右上角 "Fork" 按钮
3. Fork 到你的 GitHub 账号

#### 2.2 或者直接使用官方仓库

如果只是测试使用，可以直接使用官方仓库：
```
https://github.com/Wei-Shaw/claude-relay-service
```

#### 2.3 确认 Dockerfile 存在

Back4app 需要项目根目录有 `Dockerfile`。

检查仓库根目录是否有 `Dockerfile` 文件：
- ✅ 官方仓库已包含 Dockerfile
- ✅ 无需额外配置

---

### 第三步：部署到 Back4app

#### 3.1 登录 Back4app 控制台

访问：https://containers.back4app.com/ 并登录

#### 3.2 创建新的 Container 应用

1. 点击 "New App" 按钮
2. 选择 "Container as a Service"

#### 3.3 连接 GitHub 仓库

**方法 A：使用 GitHub 集成（推荐）**

1. 选择 "Import from GitHub"
2. 授权 Back4app 访问你的 GitHub 账号
3. 选择你的仓库：
   - 如果 Fork 了：选择 `你的用户名/claude-relay-service`
   - 如果用官方：需要先 Fork 才能连接
4. 选择分支：`main`

**方法 B：使用 GitHub URL**

1. 如果上述方法不可用，尝试直接输入 GitHub 仓库 URL
2. 输入：`https://github.com/你的用户名/claude-relay-service`

#### 3.4 配置基础信息

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **App Name** | `claude-relay-service` | 应用名称 |
| **Plan** | `Free` | 选择免费计划 |
| **Region** | 选择最近的区域 | 可能在创建时不可选 |

#### 3.5 配置环境变量

在 "Environment Variables" 部分，添加以下变量：

**必填环境变量**

```bash
# 🔐 安全密钥（必填 - 需要随机生成）
JWT_SECRET=your-random-jwt-secret-at-least-64-characters-long
ENCRYPTION_KEY=your-random-32-character-key

# 📊 Redis 配置（必填 - 从 Upstash 获取）
REDIS_HOST=your-endpoint.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-redis-password
REDIS_ENABLE_TLS=true

# 🌐 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 👤 管理员凭据（必填 - 自定义设置）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**⚠️ 重要说明**：

1. **安全密钥**：
   - 提供的密钥已经过安全随机生成，可直接使用
   - 或使用以下命令重新生成：
     ```bash
     # 生成 JWT_SECRET (128字符)
     openssl rand -hex 64

     # 生成 ENCRYPTION_KEY (64字符)
     openssl rand -hex 32
     ```
   - ⚠️ **部署后不要更改密钥**，否则已有数据无法解密

2. **管理员凭据**：
   - 必须设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
   - 用于登录 Web 管理界面
   - 建议使用强密码（包含大小写字母、数字、特殊字符）

3. **Redis 配置**：
   - 替换为你的 Upstash Redis 连接信息
   - 必须启用 `REDIS_ENABLE_TLS=true`

**可选环境变量**

```bash
# 📝 日志配置
LOG_LEVEL=info

# ⏱️ 超时配置
REQUEST_TIMEOUT=600000

# 🛠️ 系统配置
TIMEZONE_OFFSET=8
TRUST_PROXY=true
```

#### 3.6 配置构建设置

- **Dockerfile Path**: `Dockerfile`（默认，无需修改）
- **Docker Context**: `.`（根目录，默认）
- **Port**: `3000`（应用监听端口）

#### 3.7 创建并部署

1. 检查所有配置是否正确
2. 点击 "Create App" 或 "Deploy"
3. Back4app 会自动：
   - 拉取 GitHub 仓库代码
   - 构建 Docker 镜像
   - 启动容器（约 3-5 分钟）

---

### 第四步：验证部署

#### 4.1 查看部署状态

在 Back4app 控制台：
1. 找到你的应用
2. 查看 "Logs" 标签：实时构建和运行日志
3. 等待状态变为 "Running" 或 "Live"

#### 4.2 查看初始化日志

在日志中查找类似内容：

```
🚀 Claude Relay Service 启动中...
✅ 环境配置已就绪
📋 首次启动，执行初始化设置...
📌 检测到预设的管理员凭据
✅ 初始化完成
🌐 启动 Claude Relay Service...
Server is running on http://0.0.0.0:3000
```

#### 4.3 获取服务 URL

Back4app 会自动分配一个临时 URL（格式 `.b4a.run`）：
```
https://your-app-user.b4a.run
```

**⚠️ 重要警告**：
- 这个域名**仅在 60 分钟内有效**
- 60 分钟后需要升级到付费套餐获取永久域名
- 或者配置自定义域名（需要付费套餐）

**临时测试可以，长期使用不推荐！**

#### 4.4 测试健康检查

```bash
curl https://your-app-name.back4app.io/health
```

预期返回：
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "services": {
    "redis": "connected"
  }
}
```

#### 4.5 访问管理界面

1. 在浏览器中打开：`https://your-app-name.back4app.io/web`
2. 使用管理员凭据登录：
   - 用户名：你设置的 `ADMIN_USERNAME`
   - 密码：你设置的 `ADMIN_PASSWORD`
3. 首次登录后建议修改管理员密码

---

## 🔋 保活测试

### 为什么需要测试？

Back4app 官方文档**没有明确说明**免费计划是否会因闲置而休眠。我们需要实际测试。

### 测试步骤

#### 测试 1：短时间闲置（15分钟）

1. **停止访问服务**：关闭所有客户端，不访问任何端点
2. **等待 15 分钟**
3. **测试访问**：
   ```bash
   time curl https://your-app-name.back4app.io/health
   ```
4. **观察响应时间**：
   - **正常**：< 1 秒（服务未休眠）
   - **异常**：> 10 秒（可能有冷启动）

#### 测试 2：长时间闲置（1小时）

1. **停止访问服务**：等待 1 小时
2. **测试访问**：
   ```bash
   time curl https://your-app-name.back4app.io/health
   ```
3. **记录结果**

#### 测试 3：夜间闲置（8小时）

1. **晚上停止访问**
2. **第二天早上测试**
3. **观察冷启动情况**

### 如果发现会休眠

如果测试发现 Back4app 会自动休眠，配置保活：

#### 方式 1：Better Stack 监控（推荐）

1. 注册：https://betterstack.com/
2. 创建 Uptime Monitor：
   ```
   URL: https://your-app-name.back4app.io/health
   Check Frequency: 30 seconds
   ```
3. 配置告警通知（可选）

详细配置参考：[RENDER_UPSTASH_DEPLOYMENT.md 的保活部分](./RENDER_UPSTASH_DEPLOYMENT.md#-保活配置免费计划必读)

#### 方式 2：UptimeRobot

1. 注册：https://uptimerobot.com/
2. 添加监控：
   ```
   Monitor Type: HTTP(s)
   URL: https://your-app-name.back4app.io/health
   Monitoring Interval: 5 minutes
   ```

### 如果不会休眠

✅ 恭喜！Back4app 免费计划不休眠，无需配置保活。

---

## 🌐 域名配置（重要）

### 免费套餐的域名限制

**默认域名**：`https://your-app-user.b4a.run`

**限制**：
- ⏰ **仅 60 分钟有效**
- ❌ **不适合生产环境**
- ❌ **无法用于长期部署**

### 解决方案

#### 方案 1：升级到付费套餐（推荐）

**Back4app Shared Plan ($5/月)**：
- ✅ 永久的 `.b4a.run` 域名
- ✅ 支持自定义域名绑定
- ✅ 512MB RAM（双倍资源）
- ✅ 更稳定的服务

**升级步骤**：
1. 在 Back4app 控制台进入应用设置
2. 选择 "Upgrade Plan"
3. 选择 "Shared Plan"
4. 完成支付

#### 方案 2：使用自定义域名（需要付费套餐）

**前提**：必须升级到 Shared Plan 或更高

**步骤**：

1. **准备域名**：注册或使用现有域名

2. **在 Back4app 添加域名**：
   - 进入应用设置 → Domains
   - 点击 "Add Custom Domain"
   - 输入你的域名（如 `api.yourdomain.com`）

3. **配置 DNS**：

   在你的域名提供商（Cloudflare、阿里云等）添加记录：

   ```
   类型: CNAME
   名称: api（或你的子域名）
   值: custom.b4a.run（Back4app 提供）
   TTL: 自动或 300 秒
   ```

4. **等待 DNS 生效**：
   - 通常需要 5-30 分钟
   - 最长可能需要 24 小时

5. **自动 SSL**：
   - Back4app 自动申请 Let's Encrypt 证书
   - 自动配置 HTTPS

#### 方案 3：使用 Cloudflare Workers 转发（免费但复杂）

如果暂时不想付费，可以用 Cloudflare Workers 做临时转发：

**工作原理**：
```
用户访问 api.yourdomain.com
    ↓
Cloudflare Worker 转发
    ↓
Back4app 临时域名（每 60 分钟手动更新）
```

**Cloudflare Worker 代码**：

```javascript
export default {
  async fetch(request) {
    // ⚠️ 每 60 分钟需要手动更新这个 URL
    const back4appUrl = "https://your-app-user.b4a.run";

    const url = new URL(request.url);
    const targetUrl = back4appUrl + url.pathname + url.search;

    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    return fetch(newRequest);
  }
}
```

**缺点**：
- ⚠️ 每 60 分钟需要手动更新 Worker 代码
- ⚠️ 不实际，维护成本太高
- ⚠️ **不推荐**

#### 方案 4：迁移到其他平台（推荐）

**如果不想付费**，建议迁移到：

| 平台 | 域名 | 免费套餐 | 需要绑卡 |
|------|------|---------|---------|
| **Hugging Face** | 永久 | ✅ | ❌ |
| **Render** | 永久 | ✅ | ✅ |
| **VPS + Docker** | 自定义 | - | ✅ |

---

## 🔄 自动更新配置

### GitHub 自动部署

Back4app 支持 GitHub 集成，代码推送自动部署：

**工作流程**：
1. 修改代码并推送到 GitHub
2. Back4app 自动检测到更新
3. 自动拉取代码并重新构建
4. 自动部署新版本（约 3-5 分钟）

**启用自动部署**：
1. 在 Back4app 应用设置中
2. 找到 "GitHub Integration" 或 "Auto Deploy"
3. 确保已启用

**手动触发部署**：
1. 在 Back4app 控制台
2. 找到你的应用
3. 点击 "Redeploy" 或 "Deploy" 按钮

---

## 🔧 配置客户端

部署成功后，配置客户端使用你的中转服务。

### Claude Code 配置

```bash
# 设置环境变量
export ANTHROPIC_BASE_URL="https://your-app-name.back4app.io/api/"
export ANTHROPIC_AUTH_TOKEN="你的API密钥"

# 测试连接
claude "Hello, test connection"
```

### VSCode Claude 插件配置

编辑 `~/.claude/config.json`：

```json
{
  "primaryApiKey": "你的API密钥",
  "baseURL": "https://your-app-name.back4app.io/api/"
}
```

### SillyTavern 配置

1. 打开 SillyTavern
2. 进入 API 设置
3. 配置：
   ```
   API: Claude
   API URL: https://your-app-name.back4app.io/api/
   API Key: 你的API密钥
   ```

### Gemini CLI 配置

```bash
export CODE_ASSIST_ENDPOINT="https://your-app-name.back4app.io/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

---

## 🐛 故障排查

### 部署失败

**症状**：构建或部署过程失败

**解决方法**：
1. 检查 Back4app Logs 查看错误信息
2. 确认 Dockerfile 存在于仓库根目录
3. 验证环境变量配置正确
4. 检查 GitHub 仓库是否可访问
5. 尝试重新部署（Redeploy 按钮）

**常见错误**：

```
Error: No Dockerfile found
→ 确认仓库根目录有 Dockerfile
→ 检查 Dockerfile Path 配置

Error: Redis connection failed
→ 检查 REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
→ 确认 REDIS_ENABLE_TLS=true

Error: Port already in use
→ 确认 PORT=3000 且容器监听 3000 端口
```

### 服务无法访问

**症状**：部署成功但无法访问服务 URL

**解决方法**：
1. 检查服务状态是否为 "Running"
2. 查看日志是否有错误
3. 测试健康检查端点：
   ```bash
   curl https://your-app-name.back4app.io/health
   ```
4. 确认防火墙或网络限制

### Redis 连接问题

**症状**：服务启动失败，日志显示 Redis 连接错误

**解决方法**：
1. 验证 Upstash Redis 连接信息
2. 本地测试连接：
   ```bash
   redis-cli -h your-endpoint.upstash.io -p 6379 -a password --tls
   ```
3. 确认环境变量正确：
   - `REDIS_HOST`：Upstash 端点
   - `REDIS_PORT`：通常是 6379
   - `REDIS_PASSWORD`：Upstash 密码
   - `REDIS_ENABLE_TLS`：必须为 `true`

### 管理员登录失败

**症状**：无法使用管理员凭据登录

**解决方法**：
1. 确认环境变量已设置：
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
2. 检查日志确认初始化成功
3. 尝试重启服务（Redeploy）
4. 如果仍然失败，检查 Redis 数据

### 256MB RAM 不够用

**症状**：服务频繁崩溃或响应缓慢

**解决方法**：

**方案 1：优化资源使用**
- 减少并发连接数
- 限制单个用户的请求频率
- 清理不必要的 Redis 数据

**方案 2：升级到付费计划**
- Back4app Shared Plan：$5/月
  - 0.5 CPU, 512 MB RAM
- Back4app Dedicated Plan：$20/月
  - 1 CPU, 2 GB RAM

**方案 3：迁移到其他平台**
- Hugging Face Spaces（可能有更多资源）
- Render Starter（$7/月，512MB RAM）

---

## 📊 资源监控

### 查看资源使用情况

在 Back4app 控制台：
1. 进入你的应用
2. 查看 "Metrics" 或 "Monitoring" 标签
3. 观察：
   - CPU 使用率
   - 内存使用率
   - 网络流量
   - 请求数

### 使用统计

在 Claude Relay Service 管理界面：
1. 访问「仪表板」
2. 查看：
   - 总请求数
   - Token 使用量
   - 账户状态
   - API Key 使用情况

---

## 🔒 安全建议

### 1. 密钥管理

- ✅ 使用强随机密钥（JWT_SECRET, ENCRYPTION_KEY）
- ✅ 定期轮换管理员密码
- ✅ 不要在代码中硬编码密钥
- ✅ 使用环境变量存储敏感信息
- ⚠️ Back4app 环境变量在控制台可见，注意账号安全

### 2. 网络安全

- ✅ Back4app 默认启用 HTTPS
- ✅ 使用自定义域名（如需要）
- ✅ 定期检查访问日志
- ⚠️ 免费计划可能无法配置 IP 白名单

### 3. 访问控制

- ✅ 为每个用户创建独立 API Key
- ✅ 设置合理的使用限制
- ✅ 定期审查和清理不活跃的 API Key
- ✅ 监控异常访问模式

---

## 💡 优化建议

### 性能优化

1. **减少内存占用**：
   - 限制并发连接数
   - 优化 Redis 数据结构
   - 定期清理过期数据

2. **提高响应速度**：
   - 使用 Redis 缓存
   - 优化数据库查询
   - 启用 HTTP/2

3. **监控和告警**：
   - 配置 Better Stack 监控
   - 设置资源使用告警
   - 定期查看日志

### 成本优化

1. **免费额度管理**：
   - 监控流量使用（100GB/月）
   - 监控 Upstash 命令数（500K/月）
   - 避免不必要的请求

2. **按需升级**：
   - 如果 256MB RAM 不够，升级到 Shared Plan ($5/月)
   - 考虑使用量是否值得付费
   - 对比其他平台（Render $7/月，512MB RAM）

---

## 📚 参考资源

- **项目仓库**：https://github.com/Wei-Shaw/claude-relay-service
- **Back4app 文档**：https://www.back4app.com/docs-containers
- **Upstash 文档**：https://docs.upstash.com/
- **Claude API 文档**：https://docs.anthropic.com/

---

## ✅ 部署检查清单

### 准备阶段
- [ ] Back4app 账号已注册（无需信用卡）
- [ ] Upstash Redis 数据库已创建
- [ ] Redis 连接信息已记录
- [ ] GitHub 账号已准备
- [ ] 项目已 Fork 到个人账号（或准备使用官方仓库）

### 部署阶段
- [ ] Back4app Container 应用已创建
- [ ] GitHub 仓库已连接
- [ ] 环境变量已配置（JWT_SECRET, ENCRYPTION_KEY, REDIS_*, ADMIN_*）
- [ ] 构建配置已确认（Dockerfile, Port）
- [ ] 应用已成功部署（状态为 Running）

### 验证阶段
- [ ] 健康检查端点返回正常（/health）
- [ ] 可以访问管理界面（/web）
- [ ] 管理员登录成功
- [ ] 已添加至少一个 Claude 账户
- [ ] 已创建至少一个 API Key
- [ ] 客户端配置完成并测试成功

### 保活测试
- [ ] 已完成 15 分钟闲置测试
- [ ] 已完成 1 小时闲置测试
- [ ] 已完成夜间闲置测试
- [ ] 如果会休眠，已配置保活服务（Better Stack/UptimeRobot）
- [ ] 保活效果已验证

### 监控和维护
- [ ] GitHub 自动部署已启用
- [ ] 资源使用监控已配置
- [ ] 告警通知已设置（可选）
- [ ] 重要配置已备份

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：Back4app Logs 和应用日志
2. **阅读文档**：本文档和主 README.md
3. **提交 Issue**：https://github.com/Wei-Shaw/claude-relay-service/issues
4. **Back4app 支持**：https://www.back4app.com/docs-containers

---

**🎉 恭喜！你已成功部署 Claude Relay Service 到 Back4app！**

**下一步**：
1. 完成保活测试（重要）
2. 根据测试结果决定是否需要保活服务
3. 如果 256MB RAM 不够，考虑升级或迁移到其他平台

现在可以开始使用 Claude Code、Gemini CLI、SillyTavern 等工具了！
