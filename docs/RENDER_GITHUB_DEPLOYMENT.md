# Claude Relay Service - Render GitHub 部署指南

本指南详细说明如何使用 Render.com 的 GitHub 集成方式（而非 Docker）部署 Claude Relay Service。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [📋 前置准备](#-前置准备)
- [🔧 部署步骤](#-部署步骤)
  - [第一步：创建 Upstash Redis](#第一步创建-upstash-redis-数据库)
  - [第二步：Fork 项目到 GitHub](#第二步fork-项目到-github)
  - [第三步：在 Render 创建 Web Service](#第三步在-render-创建-web-service)
  - [第四步：配置环境变量](#第四步配置环境变量)
  - [第五步：验证部署](#第五步验证部署)
- [🔄 自动更新配置](#-自动更新配置)
- [🔋 保活配置](#-保活配置)
- [🔧 配置客户端](#-配置客户端)
- [🐛 故障排查](#-故障排查)
- [✅ 部署检查清单](#-部署检查清单)

---

## 🚀 快速开始

**部署方式**：GitHub 仓库直接部署（Node.js 原生构建）
**更新方式**：Git Push 自动触发重新部署

**预计时间**：10-15分钟

**核心优势**：
- ✅ **GitHub 集成**：代码推送自动部署
- ✅ **无需 Docker 知识**：Render 自动检测 Node.js 项目
- ✅ **自动构建**：自动运行 npm install 和启动命令
- ✅ **零配置**：基于 package.json 自动配置
- ✅ **实时日志**：直接查看应用日志

**前置要求**：
- Render 账号（免费注册）
- Upstash 账号（免费注册）
- GitHub 账号（代码托管）
- **需要绑定信用卡**（但免费计划不会扣费）

**⚠️ 关键配置（必须正确设置）**：
- **Root Directory**：必须留空或设为 `.`，**不要**设为 `src`
- **Start Command**：`node src/app.js`（不是 `npm start`）
- **环境变量**：`NPM_CONFIG_PRODUCTION=false`（防止 `vite: not found` 错误）
- 详见第三步和第四步配置

---

## 📋 前置准备

### 1. 注册账号

**Render.com 账号**
- 访问：https://render.com/
- 点击 "Get Started" 注册账号
- 可使用 GitHub 账号快速登录
- ⚠️ **需要绑定信用卡**（免费计划不会自动扣费）

**Upstash Redis 账号**
- 访问：https://upstash.com/
- 点击 "Sign Up" 注册账号
- 可使用 GitHub/Google 账号快速登录
- 免费计划：500K 命令/月，256MB 存储

**GitHub 账号**
- 访问：https://github.com/
- 如已有账号可跳过

### 2. 费用说明

**免费方案组合**
- Render Free Plan：$0/月（有休眠限制）
- Upstash Free Plan：$0/月
- **总计：$0/月**

**推荐付费方案**（生产环境）
- Render Starter Plan：$7/月（无休眠）
- Upstash Pay-as-you-go：$0.2/100K 命令
- **总计：约$7-10/月**

---

## 🔧 部署步骤

### 第一步：创建 Upstash Redis 数据库

#### 1.1 登录 Upstash 控制台

1. 访问：https://console.upstash.com/
2. 使用你的账号登录

#### 1.2 创建 Redis 数据库

1. 点击 "Create Database" 按钮
2. 填写配置信息：
   - **Name**: `claude-relay-redis`
   - **Type**: 选择 `Regional`（区域性数据库，免费）
   - **Region**: 选择离你最近的区域
     - 推荐：`us-east-1` (美东) 或 `ap-southeast-1` (新加坡)
   - **Eviction**: 选择 `noeviction`（不自动清除数据）
   - **TLS**: 保持启用（默认）

3. 点击 "Create" 创建数据库

#### 1.3 获取连接信息

创建完成后，在数据库详情页面找到以下信息：

```
📋 复制以下信息，稍后需要使用：

Endpoint: redis-xxxxx.upstash.io
Port: 6379 或 xxxxx
Password: your-upstash-redis-password
```

---

### 第二步：Fork 项目到 GitHub

#### 2.1 Fork 官方项目

1. 访问官方项目：https://github.com/Wei-Shaw/claude-relay-service
2. 点击右上角 "Fork" 按钮
3. 选择你的 GitHub 账号
4. 等待 Fork 完成

#### 2.2 确认项目结构

Fork 完成后，确认你的仓库包含：
- ✅ `package.json`（必需：Node.js 依赖配置）
- ✅ `src/app.js`（必需：应用入口文件）
- ✅ `.env.example`（参考：环境变量示例）
- ✅ `web/admin-spa/`（前端管理界面）

---

### 第三步：在 Render 创建 Web Service

#### 3.1 登录 Render 控制台

访问：https://dashboard.render.com/ 并登录

#### 3.2 创建新的 Web Service

1. 点击 "New +" 按钮
2. 选择 "Web Service"
3. **选择 "Build and deploy from a Git repository"**
4. 点击 "Next"

#### 3.3 连接 GitHub 仓库

**授权 GitHub**：
1. 点击 "Connect GitHub" 或 "Configure account"
2. 授权 Render 访问你的 GitHub 账号
3. 选择要授权的仓库：
   - 推荐：仅选择 `claude-relay-service` 仓库
   - 或选择 "All repositories"

**选择仓库**：
1. 在仓库列表中找到 `your-username/claude-relay-service`
2. 点击 "Connect"

#### 3.4 配置 Web Service

**基础设置**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Name** | `claude-relay-service` | 服务名称（会成为 URL 的一部分） |
| **Region** | `Oregon (US West)` 或其他 | 选择区域 |
| **Branch** | `main` | Git 分支 |
| **Root Directory** | **留空或填 `.`** | ⚠️ 重要！必须是项目根目录，**不要**填 `src` |
| **Runtime** | `Node` | Render 会自动检测 |
| **Build Command** | `cp config/config.example.js config/config.js && npm install && npm run install:web && npm run build:web` | 构建命令 |
| **Start Command** | `node src/app.js` | 启动命令（不使用 npm start，避免 lint 失败） |

**⚠️ Build Command 说明**：
- `cp config/config.example.js config/config.js`：**关键步骤**！复制配置文件模板
- `npm install`：安装后端依赖
- `npm run install:web`：安装前端依赖（`web/admin-spa/` 目录）
- `npm run build:web`：构建前端静态文件（生成 `dist` 目录）
- **所有步骤必须按顺序执行**，不可省略任何一步
- 配置通过环境变量注入，不需要手动编辑 config.js

**⚠️ Start Command 说明**：
- 使用 `node src/app.js` 而不是 `npm start`
- `npm start` 会先运行 `npm run lint`，可能导致部署失败
- 直接用 node 启动避免不必要的 lint 检查

**实例类型**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Instance Type** | `Free` | 免费计划（512MB RAM, 0.5 CPU） |

**高级设置**（可选）：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Auto-Deploy** | `Yes` | 启用自动部署 |
| **Health Check Path** | `/health` | 健康检查端点 |

---

### 第四步：配置环境变量

在 "Environment Variables" 部分，添加以下环境变量：

#### 4.1 必填环境变量

点击 "Add Environment Variable" 逐个添加：

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

1. **安全密钥生成**：
   - 上面提供的密钥已经是安全随机生成的，可直接使用
   - 或使用以下命令重新生成：
     ```bash
     # 生成 JWT_SECRET（128字符）
     openssl rand -hex 64

     # 生成 ENCRYPTION_KEY（64字符）
     openssl rand -hex 32
     ```
   - ⚠️ **部署后不要更改密钥**，否则已有数据无法解密

2. **管理员凭据**：
   - 必须设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
   - 用于登录 Web 管理界面
   - 建议使用强密码

3. **Redis 配置**：
   - 替换为你的 Upstash Redis 连接信息
   - `REDIS_ENABLE_TLS` 必须设置为 `true`

#### 4.2 构建配置环境变量（重要！）

```bash
# 🔧 构建配置（必须设置，否则构建失败）
NPM_CONFIG_PRODUCTION=false
```

**⚠️ 关键说明 - 必须设置**：
- `NPM_CONFIG_PRODUCTION=false` **必须设置**
- 前端构建工具 `vite` 在 `devDependencies` 中
- Render 默认生产环境构建会跳过 devDependencies
- 不设置会导致 `sh: vite: not found` 构建错误

#### 4.3 可选环境变量

```bash
# 📝 日志配置
LOG_LEVEL=info

# ⏱️ 超时配置
REQUEST_TIMEOUT=600000

# 🛠️ 系统配置
TIMEZONE_OFFSET=8
TRUST_PROXY=true
```

#### 4.3 添加方式

**方式一：通过 UI 添加**
1. 在 "Environment Variables" 部分
2. 点击 "Add Environment Variable"
3. 输入 Key 和 Value
4. 重复添加所有变量

**方式二：批量添加（推荐）**
1. 点击 "Add from .env"
2. 粘贴所有环境变量（格式：`KEY=VALUE`，每行一个）
3. 点击 "Add Environment Variables"

---

### 第五步：验证部署

#### 5.1 创建并部署

1. 检查所有配置是否正确
2. 点击 "Create Web Service"
3. Render 会自动开始构建和部署

#### 5.2 查看构建日志

在部署页面可以看到：
- **Build Logs**：构建过程日志
- **Deploy Logs**：部署和运行日志

**预期构建流程**：
```
==> Cloning from https://github.com/your-username/claude-relay-service...
==> Checking out commit abc123...
==> Running 'npm install && npm run install:web && npm run build:web'
    npm install
    added 150 packages...
    npm run install:web
    Installing frontend dependencies...
    added 80 packages in web/admin-spa...
    npm run build:web
    Building web interface...
    Build completed successfully
==> Build successful
==> Starting service with 'node src/app.js'
    🚀 Claude Relay Service 启动中...
    ✅ 环境配置已就绪
    📋 首次启动，执行初始化设置...
    📌 检测到预设的管理员凭据
    ✅ 初始化完成
    🌐 启动 Claude Relay Service...
    Server is running on http://0.0.0.0:3000
==> Your service is live 🎉
```

#### 5.3 获取服务 URL

部署成功后，在服务详情页面顶部可以看到你的服务 URL：
```
https://claude-relay-service-xxxx.onrender.com
```

#### 5.4 测试健康检查

```bash
curl https://your-service-url.onrender.com/health
```

**预期返回**：
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

#### 5.5 访问管理界面

1. 在浏览器中打开：`https://your-service-url.onrender.com/web`
2. 使用管理员凭据登录：
   - 用户名：你设置的 `ADMIN_USERNAME`
   - 密码：你设置的 `ADMIN_PASSWORD`

---

## 🔄 自动更新配置

### GitHub 自动部署

Render 的 GitHub 集成支持自动部署：

#### 工作流程

1. **修改代码**：在本地或 GitHub 网页编辑代码
2. **提交更改**：
   ```bash
   git add .
   git commit -m "Update configuration"
   git push origin main
   ```
3. **自动部署**：Render 检测到推送，自动触发部署
4. **零停机更新**：新版本准备好后自动切换

#### 查看部署历史

1. 在 Render 服务页面点击 "Events" 标签
2. 查看所有部署记录：
   - Commit hash
   - 部署时间
   - 部署状态（成功/失败）
   - 构建日志

#### 手动触发部署

如果需要手动重新部署：
1. 在服务页面点击 "Manual Deploy"
2. 选择 "Deploy latest commit"
3. 或选择 "Clear build cache & deploy"（强制完全重新构建）

#### 禁用自动部署

如果不想自动部署：
1. 进入服务设置（Settings）
2. 找到 "Auto-Deploy"
3. 设置为 "No"
4. 之后需要手动点击 "Manual Deploy" 才会部署

---

## 🔋 保活配置

### 为什么需要保活？

**Render 免费计划的限制**：
- ⏰ **15分钟无活动自动休眠**
- 🐌 **冷启动时间：30-50秒**
- ✅ **月配额：750小时**（足够全月运行）

### 保活方案

#### 方式一：Better Stack 监控（推荐）

**优势**：
- ✅ 免费 10 个监控项
- ✅ 30秒检查间隔
- ✅ 邮件/Slack 告警
- ✅ 自动生成状态页

**配置步骤**：

1. **注册 Better Stack**
   - 访问：https://betterstack.com/
   - 使用 GitHub/Google 快速注册

2. **创建 Uptime Monitor**
   - 进入 "Uptime" 页面
   - 点击 "Add Monitor"
   - 配置：
     ```
     Monitor Type: HTTP(S)
     URL: https://your-service-url.onrender.com/health
     Name: Claude Relay Service
     Check Frequency: 30 seconds
     Expected Status Code: 200
     ```

3. **配置告警**（可选）
   - Email 告警
   - Slack 集成
   - Webhook 通知

**详细配置**：参考 [RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md#方式一better-stack-监控推荐)

#### 方式二：UptimeRobot（备选）

1. 访问：https://uptimerobot.com/
2. 注册并登录
3. 添加监控：
   ```
   Monitor Type: HTTP(s)
   URL: https://your-service-url.onrender.com/health
   Monitoring Interval: 5 minutes
   ```

#### 方式三：升级到付费计划（最佳）

**Render Starter Plan ($7/月)**：
- ✅ 无休眠
- ✅ 更快响应
- ✅ 99.9% SLA

**升级步骤**：
1. 在服务设置中找到 "Instance Type"
2. 选择 "Starter"
3. 确认升级

---

## 🔧 配置客户端

部署成功后，配置客户端使用你的中转服务。

### Claude Code 配置

```bash
# 设置环境变量
export ANTHROPIC_BASE_URL="https://your-service-url.onrender.com/api/"
export ANTHROPIC_AUTH_TOKEN="你的API密钥"

# 测试连接
claude "Hello, test connection"
```

### VSCode Claude 插件配置

编辑 `~/.claude/config.json`：

```json
{
  "primaryApiKey": "你的API密钥",
  "baseURL": "https://your-service-url.onrender.com/api/"
}
```

### SillyTavern 配置

1. 打开 SillyTavern
2. 进入 API 设置
3. 配置：
   ```
   API: Claude
   API URL: https://your-service-url.onrender.com/api/
   API Key: 你的API密钥
   ```

### Gemini CLI 配置

```bash
export CODE_ASSIST_ENDPOINT="https://your-service-url.onrender.com/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

---

## 🐛 故障排查

### 构建失败

**症状**：Build 阶段失败

**常见原因和解决方法**：

1. **依赖安装失败**
   ```
   Error: Cannot find module 'xxx'
   ```
   **解决**：
   - 检查 `package.json` 中的依赖是否完整
   - 在服务设置中点击 "Clear build cache & deploy"

2. **Node.js 版本不匹配**
   ```
   Error: The engine "node" is incompatible
   ```
   **解决**：
   - 检查 `package.json` 中 `engines.node` 配置
   - 确保设置为 `"node": ">=18.0.0"`

3. **vite 命令未找到（最常见）**
   ```
   sh: 1: vite: not found
   Error: npm run build:web failed
   ```
   **原因**：Render 默认生产环境构建跳过 devDependencies，而 vite 在 devDependencies 中

   **解决**：
   - ⚠️ **必须添加环境变量**：`NPM_CONFIG_PRODUCTION=false`
   - 在 Render 控制台 → Environment Variables → 添加该变量
   - 添加后点击 "Manual Deploy" → "Deploy latest commit" 重新部署

4. **前端依赖安装失败**
   ```
   Error: npm run install:web failed
   ```
   **解决**：
   - 检查 `web/admin-spa/package.json` 是否存在
   - 确认 Build Command 包含 `npm run install:web` 步骤
   - 检查是否设置了 `NPM_CONFIG_PRODUCTION=false`
   - 查看构建日志中的详细错误信息

5. **Web 界面构建失败**
   ```
   Error: npm run build:web failed
   ```
   **解决**：
   - 确认前端依赖已正确安装（`npm run install:web` 必须先成功）
   - 检查 `web/admin-spa/package.json` 和构建脚本是否存在
   - 确认 `NPM_CONFIG_PRODUCTION=false` 已设置
   - 查看构建日志中的详细错误信息

### 启动失败

**症状**：Build 成功但服务无法启动

**常见原因和解决方法**：

1. **模块未找到错误 - 路径问题（最常见）**
   ```
   Error: Cannot find module '../config/config'
   Require stack: /opt/render/project/src/src/app.js
   ```
   **原因**：注意错误路径显示 `src/src/app.js`（两个 src），说明 Root Directory 被错误设置为 `src`

   **解决**：
   - ⚠️ **检查 Root Directory 配置**
   - 在 Render 控制台 → Settings → Root Directory
   - **必须留空或设置为 `.`**（项目根目录）
   - **不要设置为 `src`**
   - 确认 Start Command 为 `node src/app.js`
   - 保存后重新部署

   **替代方案**（如果无法修改 Root Directory）：
   - 如果 Root Directory 必须保持为 `src`
   - 则修改 Start Command 为：`node app.js`（不带 src/ 前缀）

2. **Redis 连接失败**
   ```
   Error: Redis connection failed
   ```
   **解决**：
   - 验证 `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` 配置
   - 确认 `REDIS_ENABLE_TLS=true`
   - 测试 Upstash 连接：
     ```bash
     redis-cli -h your-endpoint.upstash.io -p 6379 -a password --tls
     ```

2. **环境变量缺失**
   ```
   Error: JWT_SECRET or ENCRYPTION_KEY is not set
   ```
   **解决**：
   - 检查所有必需的环境变量是否已添加
   - 确认环境变量值没有多余的空格或引号

3. **端口检测失败**
   ```
   No open ports detected, continuing to scan...
   ```
   **原因**：应用启动失败，未能监听 3000 端口

   **解决**：
   - 检查上述启动日志中的错误信息
   - 确认 `PORT=3000` 和 `HOST=0.0.0.0` 环境变量已设置
   - 确认 Start Command 为 `node src/app.js`
   - 查看完整的部署日志排查具体错误

### 服务运行缓慢

**症状**：首次访问需要很长时间

**原因**：免费计划休眠机制

**解决方法**：
1. 配置保活服务（Better Stack）
2. 或升级到 Starter 付费计划

### 管理界面无法访问

**症状**：访问 `/web` 返回 404 或静态资源加载失败

**解决方法**：

1. **确认 Web 界面已构建**
   - 检查构建日志中是否有 `npm run build:web` 成功的信息
   - 如果构建命令中缺少 `npm run build:web`，添加后重新部署

2. **检查静态文件服务**
   - 确认 `web/admin-spa/dist/` 目录已生成
   - 查看服务日志是否有静态文件服务错误

### 自动部署不工作

**症状**：推送代码到 GitHub 但 Render 没有自动部署

**解决方法**：

1. **检查 Auto-Deploy 设置**
   - 进入服务设置
   - 确认 "Auto-Deploy" 设置为 "Yes"

2. **检查 GitHub 连接**
   - 进入 Account Settings → Connected Accounts
   - 确认 GitHub 连接正常
   - 重新授权 Render 访问仓库

3. **检查 Webhook**
   - 在 GitHub 仓库设置 → Webhooks
   - 应该有来自 Render 的 webhook
   - 查看 webhook 的 "Recent Deliveries" 是否有错误

---

## 📊 监控和维护

### 查看日志

**实时日志**：
1. 在 Render 服务页面
2. 点击 "Logs" 标签
3. 查看实时运行日志

**日志过滤**：
```
# 过滤包含 "ERROR" 的日志
搜索框输入: ERROR

# 查看最近的日志
自动滚动到最新日志
```

### 性能监控

**Render 提供的指标**：
1. 点击 "Metrics" 标签
2. 查看：
   - CPU 使用率
   - 内存使用率
   - 网络流量
   - HTTP 请求统计

### 管理界面监控

1. 登录 Web 管理界面
2. 访问「仪表板」
3. 查看：
   - 总请求数
   - Token 使用量
   - 账户状态
   - API Key 使用情况

---

## 🔒 安全建议

### 1. 密钥管理

- ✅ 使用强随机密钥
- ✅ 定期轮换管理员密码
- ✅ 不要在代码中硬编码密钥
- ✅ 使用 Render 的环境变量功能

### 2. 网络安全

- ✅ Render 默认启用 HTTPS
- ✅ 使用自定义域名（可选）
- ✅ 定期检查访问日志
- ✅ 配置 IP 白名单（如需要）

### 3. 访问控制

- ✅ 为每个用户创建独立 API Key
- ✅ 设置合理的使用限制
- ✅ 定期审查和清理 API Key
- ✅ 监控异常访问

---

## 💡 优化建议

### 构建优化

**加快构建速度**：

1. **使用缓存**：
   - Render 会自动缓存 `node_modules`
   - 只有 `package.json` 变化时才重新安装依赖

2. **优化构建命令**：
   ```bash
   # 如果不需要 Web 界面，可以去掉构建步骤
   npm install

   # 如果需要 Web 界面
   npm install && npm run build:web
   ```

### 运行时优化

1. **启用压缩**：
   - 项目已包含 `compression` 中间件
   - 确保 `NODE_ENV=production`

2. **优化日志级别**：
   ```bash
   # 生产环境使用 info 级别
   LOG_LEVEL=info

   # 调试时使用 debug 级别
   LOG_LEVEL=debug
   ```

---

## 🎯 生产环境建议

### 升级到付费计划

**推荐场景**：
- 生产环境使用
- 需要稳定响应时间
- 多用户并发使用

**Render Starter Plan ($7/月)**：
- 无休眠时间
- 更多 CPU 和内存
- 99.9% SLA

### 自定义域名

1. **在 Render 添加域名**：
   - 进入服务设置 → Custom Domains
   - 点击 "Add Custom Domain"
   - 输入你的域名

2. **配置 DNS**：
   ```
   类型: CNAME
   名称: api (或你的子域名)
   值: <Render提供的CNAME>
   TTL: 自动或300秒
   ```

3. **自动 SSL**：
   - Render 自动申请 Let's Encrypt 证书
   - 自动更新证书

---

## 📚 参考资源

- **项目仓库**：https://github.com/Wei-Shaw/claude-relay-service
- **Render 文档**：https://render.com/docs
- **Upstash 文档**：https://docs.upstash.com/
- **Node.js 文档**：https://nodejs.org/docs

---

## ✅ 部署检查清单

### 准备阶段
- [ ] Render 账号已注册（需绑定信用卡）
- [ ] Upstash Redis 数据库已创建
- [ ] Redis 连接信息已记录
- [ ] GitHub 账号已准备
- [ ] 项目已 Fork 到个人账号

### 部署阶段
- [ ] Render Web Service 已创建
- [ ] GitHub 仓库已连接
- [ ] **Root Directory 留空或设置为 `.`**（关键！不要设置为 `src`）
- [ ] Build Command 已设置：`npm install && npm run install:web && npm run build:web`
- [ ] Start Command 已设置：`node src/app.js`（不是 npm start！）
- [ ] **NPM_CONFIG_PRODUCTION=false** 已设置（关键！防止 vite: not found 错误）
- [ ] 环境变量已配置（JWT_SECRET, ENCRYPTION_KEY, REDIS_*, ADMIN_*）
- [ ] 环境变量已配置（PORT=3000, HOST=0.0.0.0, NODE_ENV=production）
- [ ] Auto-Deploy 已启用
- [ ] Health Check Path 已设置：`/health`
- [ ] 服务已成功部署（状态为 "Live"）

### 验证阶段
- [ ] 健康检查端点返回正常（/health）
- [ ] 可以访问管理界面（/web）
- [ ] 管理员登录成功
- [ ] 已添加至少一个 Claude 账户
- [ ] 已创建至少一个 API Key
- [ ] 客户端配置完成并测试成功

### 保活配置（免费计划）
- [ ] 已注册 Better Stack 账号
- [ ] 已创建 Uptime Monitor（30秒检查）
- [ ] 监控 URL 已配置
- [ ] 告警通知已设置（可选）
- [ ] 保活效果已验证（等待15分钟测试）

### 维护配置
- [ ] 自动部署已测试（推送代码验证）
- [ ] 日志查看正常
- [ ] 性能监控已配置（可选）
- [ ] 重要配置已备份

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：Render Logs 和应用日志
2. **阅读文档**：本文档和主 README.md
3. **提交 Issue**：https://github.com/Wei-Shaw/claude-relay-service/issues
4. **Render 支持**：https://render.com/docs

---

**🎉 恭喜！你已成功使用 GitHub 方式部署 Claude Relay Service 到 Render！**

**下一步**：
1. 配置保活服务（免费计划推荐）
2. 添加 Claude 账户和 API Key
3. 配置客户端并开始使用

现在可以开始使用 Claude Code、Gemini CLI、SillyTavern 等工具了！
