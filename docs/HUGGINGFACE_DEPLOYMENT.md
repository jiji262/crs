# Claude Relay Service - Hugging Face Spaces + Redis 部署指南

本指南详细说明如何使用 Hugging Face Spaces（Docker SDK，免费，**不需要信用卡**）和免费 Redis 部署 Claude Relay Service。

> **💡 Redis 选择建议**：推荐使用 **Aiven for Valkey**（1GB 内存，无请求限制），比 Upstash 更适合长期使用。详见 [Aiven 迁移指南](./AIVEN_MIGRATION.md)。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [📋 前置准备](#-前置准备)
- [🐳 部署步骤](#-部署步骤)
  - [第一步：创建 Upstash Redis](#第一步创建-upstash-redis-数据库)
  - [第二步：准备项目文件](#第二步准备项目文件)
  - [第三步：创建 Hugging Face Space](#第三步创建-hugging-face-space)
  - [第四步：配置和部署](#第四步配置和部署)
  - [第五步：验证部署](#第五步验证部署)
- [🔄 更新和维护](#-更新和维护)
- [🔧 配置客户端](#-配置客户端)
- [🐛 故障排查](#-故障排查)
- [✅ 部署检查清单](#-部署检查清单)

---

## 🚀 快速开始

**部署方式**：Hugging Face Spaces Docker SDK
**更新方式**：Git 推送或 Web 界面上传

**预计时间**：20-30分钟

**核心优势**：
- ✅ **完全免费**：不需要信用卡
- ✅ **Docker 支持**：完整的 Docker 环境
- ✅ **灵活配置**：支持自定义 Dockerfile
- ✅ **大型社区**：Hugging Face ML 社区支持
- ⚠️ **注意**：主要面向 ML 应用，用于 API 服务属于"非典型用途"

**前置要求**：
- Hugging Face 账号（免费注册，不需要信用卡）
- Redis 数据库（选择一个）：
  - **推荐：Aiven for Valkey**（1GB 内存，无请求限制，永久免费）
  - 或：Upstash Redis（250MB 内存，50万次/天请求限制）
- 基础的 Git 使用知识（或使用 Web 界面）

**重要说明**：
- Hugging Face Spaces 主要用于托管 ML 模型和演示应用
- 用于部署 API 中转服务是可行的，但属于非主流用途
- 默认 CPU 实例，容器重启后数据会丢失（需要外部 Redis）
- 可能有不明确的使用限制和政策

---

## 📋 前置准备

### 1. 注册账号

**Hugging Face 账号**
- 访问：https://huggingface.co/
- 点击 "Sign Up" 注册账号
- 可使用 GitHub/Google 账号快速登录
- ✅ **完全免费，无需信用卡**

**Upstash Redis 账号**
- 访问：https://upstash.com/
- 点击 "Sign Up" 注册账号
- 可使用 GitHub/Google 账号快速登录
- 免费计划包含：500K 命令/月，256MB 存储

### 2. 费用说明

**完全免费方案**
- Hugging Face Spaces：$0/月（免费 CPU 实例）
- Upstash Free Plan：$0/月（500K 命令/月，256MB 存储）
- **总计：$0/月（无需信用卡）**

**Hugging Face Spaces 免费限制**：
- ✅ 免费 CPU 实例（资源根据平台负载动态分配）
- ⚠️ 容器重启后数据丢失（除非使用 /data 目录持久存储，需付费）
- ⚠️ 可能有不明确的使用限制
- ✅ 付费可升级到 GPU 实例或持久存储

---

## 🐳 部署步骤

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
     - 欧美用户：`us-east-1` (弗吉尼亚) 或 `eu-west-1` (爱尔兰)
     - 亚洲用户：`ap-southeast-1` (新加坡)
   - **Eviction**: 选择 `noeviction`（不自动清除数据）
   - **TLS**: 保持启用（默认）

3. 点击 "Create" 创建数据库

#### 1.3 获取连接信息

创建完成后，在数据库详情页面找到以下信息：

```
📋 复制以下信息，稍后需要使用：

Endpoint: your-endpoint.upstash.io
Port: 6379
Password: your-upstash-redis-password
```

---

### 第二步：准备项目文件

Hugging Face Spaces 有特定的项目结构要求。

#### 2.1 Fork 或克隆项目

**方法 A：Fork GitHub 仓库（推荐）**

1. 访问：https://github.com/Wei-Shaw/claude-relay-service
2. 点击右上角 "Fork" 按钮
3. Fork 到你的 GitHub 账号
4. 克隆到本地：
   ```bash
   git clone https://github.com/你的用户名/claude-relay-service.git
   cd claude-relay-service
   ```

**方法 B：直接克隆官方仓库**

```bash
git clone https://github.com/Wei-Shaw/claude-relay-service.git
cd claude-relay-service
```

#### 2.2 创建 README.md（Hugging Face Spaces 要求）

Hugging Face Spaces 需要一个包含特定头部的 README.md。

在项目根目录创建或修改 `README.md`，在文件**最顶部**添加：

```markdown
---
title: Claude Relay Service
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 3000
---

# Claude Relay Service

一个功能完整的 AI API 中转服务，支持 Claude 和 Gemini 双平台。

## 部署说明

本应用部署在 Hugging Face Spaces，使用 Docker SDK。

- 端口：3000
- 健康检查：/health
- 管理界面：/web

## 环境变量

需要在 Spaces 设置中配置以下环境变量：

- JWT_SECRET：JWT 密钥
- ENCRYPTION_KEY：加密密钥
- REDIS_HOST：Redis 主机地址
- REDIS_PORT：Redis 端口
- REDIS_PASSWORD：Redis 密码
- REDIS_ENABLE_TLS：启用 TLS（true）
- ADMIN_USERNAME：管理员用户名
- ADMIN_PASSWORD：管理员密码

详细文档请参考：https://github.com/Wei-Shaw/claude-relay-service
```

**重要说明**：
- `sdk: docker` 指定使用 Docker SDK
- `app_port: 3000` 指定应用监听端口
- 这些配置必须在 README.md 的最顶部，使用 YAML front matter 格式

#### 2.3 确认 Dockerfile

确认项目根目录有 `Dockerfile`：
- ✅ 官方仓库已包含 Dockerfile
- ✅ 无需修改

#### 2.4 创建 .gitignore（可选）

如果项目没有 `.gitignore`，创建一个：

```gitignore
node_modules/
logs/
*.log
.env
data/init.json
.DS_Store
```

---

### 第三步：创建 Hugging Face Space

#### 3.1 登录 Hugging Face

访问：https://huggingface.co/ 并登录

#### 3.2 创建新 Space

1. 点击右上角头像 → "New Space"
2. 或访问：https://huggingface.co/new-space

#### 3.3 配置 Space 基本信息

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Owner** | 你的用户名 | 选择所有者 |
| **Space name** | `claude-relay-service` | Space 名称（URL 友好） |
| **License** | `mit` 或其他 | 选择许可证 |
| **Select the Space SDK** | **Docker** | ⚠️ 必须选择 Docker |
| **Space hardware** | `CPU basic (free)` | 免费 CPU 实例 |
| **Space visibility** | `Public` 或 `Private` | 推荐 Private |

**重要**：
- ⚠️ **必须选择 Docker SDK**，不是 Gradio、Streamlit 或 Static
- Space name 将成为 URL 的一部分：`https://huggingface.co/spaces/你的用户名/space-name`
- 如果选择 Private，只有你可以访问

#### 3.4 创建 Space

点击 "Create Space" 按钮

---

### 第四步：配置和部署

#### 4.1 方法 A：使用 Git 推送（推荐）

**步骤 1：添加 Hugging Face 远程仓库**

```bash
# 在你的项目目录中
cd claude-relay-service

# 添加 Hugging Face Space 作为远程仓库
git remote add hf https://huggingface.co/spaces/你的用户名/claude-relay-service
```

**步骤 2：提交 README.md 修改**

```bash
# 确保 README.md 包含 Hugging Face 配置头部
git add README.md
git commit -m "Add Hugging Face Spaces configuration"
```

**步骤 3：推送到 Hugging Face**

```bash
# 推送到 Hugging Face Spaces
git push hf main

# 或者如果你的默认分支是 master
git push hf master:main
```

Hugging Face 会自动检测 Dockerfile 并开始构建。

**步骤 4：配置环境变量（重要）**

推送后，需要在 Hugging Face Space 设置中配置环境变量：

1. 访问你的 Space 页面：`https://huggingface.co/spaces/你的用户名/claude-relay-service`
2. 点击 "Settings" 标签
3. 找到 "Repository secrets" 或 "Variables and secrets"
4. 添加以下环境变量（一个一个添加）：

```bash
# 🔐 安全密钥（需要随机生成）
JWT_SECRET=your-random-jwt-secret-at-least-64-characters-long
ENCRYPTION_KEY=your-random-32-character-key

# 📊 Redis 配置（从 Upstash 获取）
REDIS_HOST=your-endpoint.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-redis-password
REDIS_ENABLE_TLS=true

# 🌐 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 👤 管理员凭据（自定义）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**步骤 5：重启 Space**

配置环境变量后：
1. 点击 Space 页面右上角的 "⋮" 菜单
2. 选择 "Restart Space" 或 "Factory reboot"
3. 等待容器重新启动（约 3-5 分钟）

---

#### 4.2 方法 B：使用 Web 界面上传（简单但不推荐）

如果不熟悉 Git，可以使用 Web 界面：

**步骤 1：上传文件**

1. 在 Space 页面点击 "Files and versions" 标签
2. 点击 "Add file" → "Upload files"
3. 上传以下文件：
   - `Dockerfile`（必需）
   - `README.md`（必需，包含 Hugging Face 配置）
   - `package.json`
   - 所有项目文件

**步骤 2：配置环境变量**

同上"方法 A - 步骤 4"

**步骤 3：重启 Space**

同上"方法 A - 步骤 5"

---

### 第五步：验证部署

#### 5.1 查看构建日志

1. 在 Space 页面点击 "Logs" 标签
2. 查看 Docker 构建和运行日志
3. 等待状态变为 "Running"

**预期日志**：

```
Building Docker image...
Successfully built docker image
Starting container...
🚀 Claude Relay Service 启动中...
✅ 环境配置已就绪
📋 首次启动，执行初始化设置...
📌 检测到预设的管理员凭据
✅ 初始化完成
🌐 启动 Claude Relay Service...
Server is running on http://0.0.0.0:3000
```

#### 5.2 获取 Space URL

Hugging Face 会自动分配一个 URL：
```
https://你的用户名-claude-relay-service.hf.space
```

或者通过嵌入式域名访问（如果 Space 配置了）。

#### 5.3 测试健康检查

```bash
curl https://你的用户名-claude-relay-service.hf.space/health
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

#### 5.4 访问管理界面

1. 在浏览器中打开：`https://你的用户名-claude-relay-service.hf.space/web`
2. 使用管理员凭据登录：
   - 用户名：你设置的 `ADMIN_USERNAME`
   - 密码：你设置的 `ADMIN_PASSWORD`
3. 首次登录后建议修改管理员密码

#### 5.5 添加 Claude 账户和 API Key

参考主 README.md 的说明：
1. 添加 Claude 账户（OAuth 授权）
2. 创建 API Key
3. 配置客户端使用

---

## 🔄 更新和维护

### 方法 1：Git 推送更新（推荐）

```bash
# 在本地项目目录
cd claude-relay-service

# 拉取官方更新（如果需要）
git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git
git fetch upstream
git merge upstream/main

# 推送到 Hugging Face
git push hf main
```

Hugging Face 会自动检测更新并重新构建。

### 方法 2：Web 界面更新

1. 在 Space 页面点击 "Files and versions"
2. 点击要更新的文件 → "Edit file"
3. 修改内容并保存
4. Space 会自动重新构建

### 重启 Space

如果需要手动重启：
1. 点击右上角 "⋮" 菜单
2. 选择 "Restart Space"
3. 等待重启完成

---

## 🔧 配置客户端

部署成功后，配置客户端使用你的中转服务。

### Claude Code 配置

```bash
# 设置环境变量
export ANTHROPIC_BASE_URL="https://你的用户名-claude-relay-service.hf.space/api/"
export ANTHROPIC_AUTH_TOKEN="你的API密钥"

# 测试连接
claude "Hello, test connection"
```

### VSCode Claude 插件配置

编辑 `~/.claude/config.json`：

```json
{
  "primaryApiKey": "你的API密钥",
  "baseURL": "https://你的用户名-claude-relay-service.hf.space/api/"
}
```

### SillyTavern 配置

1. 打开 SillyTavern
2. 进入 API 设置
3. 配置：
   ```
   API: Claude
   API URL: https://你的用户名-claude-relay-service.hf.space/api/
   API Key: 你的API密钥
   ```

### Gemini CLI 配置

```bash
export CODE_ASSIST_ENDPOINT="https://你的用户名-claude-relay-service.hf.space/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

---

## 🐛 故障排查

### 构建失败

**症状**：Docker 构建过程失败

**解决方法**：
1. 检查 Logs 标签查看详细错误
2. 确认 Dockerfile 格式正确
3. 确认 README.md 包含正确的 Hugging Face 配置头部
4. 确认 `sdk: docker` 和 `app_port: 3000` 配置正确
5. 尝试 Factory reboot

**常见错误**：

```
Error: SDK mismatch
→ 确认 README.md 中 sdk: docker

Error: Port not exposed
→ 确认 README.md 中 app_port: 3000
→ 确认 Dockerfile EXPOSE 3000

Error: Build timeout
→ 构建超时，可能需要优化 Dockerfile
→ 或者重试（Restart Space）
```

### Space 显示错误页面

**症状**：Space 运行但显示错误页面

**解决方法**：
1. 检查 Logs 查看运行时错误
2. 确认所有环境变量已配置
3. 测试健康检查端点：
   ```bash
   curl https://你的用户名-claude-relay-service.hf.space/health
   ```
4. 检查 Redis 连接是否正常

### Redis 连接失败

**症状**：日志显示 Redis 连接错误

**解决方法**：
1. 确认 Upstash Redis 数据库正常运行
2. 验证环境变量：
   - `REDIS_HOST`：Upstash 端点
   - `REDIS_PORT`：通常是 6379
   - `REDIS_PASSWORD`：Upstash 密码
   - `REDIS_ENABLE_TLS`：必须为 `true`
3. 本地测试连接：
   ```bash
   redis-cli -h your-endpoint.upstash.io -p 6379 -a password --tls
   ```
4. 检查网络连接（Hugging Face → Upstash）

### 环境变量未生效

**症状**：服务启动但环境变量配置无效

**解决方法**：
1. 在 Settings → Repository secrets 确认变量已添加
2. 注意变量名大小写必须完全匹配
3. 保存变量后必须 Restart Space
4. 检查 Logs 中的环境变量加载情况

### Space 频繁重启

**症状**：Space 不断重启，无法稳定运行

**可能原因**：
1. 内存不足（免费 CPU 实例资源有限）
2. 健康检查失败
3. 应用崩溃

**解决方法**：
1. 检查 Logs 查找崩溃原因
2. 优化应用资源使用
3. 考虑升级到付费实例（更多资源）
4. 检查健康检查端点是否正常

### 数据丢失

**症状**：Space 重启后数据丢失

**原因**：
- Hugging Face Spaces 默认不持久化容器内的数据
- 只有 `/data` 目录可以持久化（需付费升级）

**解决方法**：
- ✅ 使用 Upstash Redis 存储所有重要数据（已配置）
- ✅ 通过环境变量配置管理员凭据（已配置）
- ✅ 所有业务数据（API Keys、Claude 账户）存储在 Redis
- ⚠️ 不要在容器内存储重要文件

---

## ⚠️ 使用注意事项

### Hugging Face Spaces 的限制

1. **主要用途**：
   - Hugging Face Spaces 主要用于托管 ML 模型和演示应用
   - 用于 API 中转服务是"非典型用途"
   - 可能违反服务条款（需自行确认）

2. **资源限制**：
   - 免费 CPU 实例资源有限且不保证
   - 可能有并发连接数限制
   - 可能有请求频率限制

3. **稳定性**：
   - 平台可能随时调整免费资源配额
   - 不建议用于生产环境或关键服务
   - 建议用于测试和个人使用

4. **服务条款**：
   - 仔细阅读 Hugging Face 服务条款
   - 确认你的使用场景符合条款
   - 访问：https://huggingface.co/terms-of-service

### 推荐使用场景

✅ **适合**：
- 个人测试和开发
- 学习和实验
- 临时使用（1-2周）
- 作为备用方案

⚠️ **不适合**：
- 生产环境
- 商业用途
- 需要高稳定性的场景
- 多用户长期使用

### 替代方案

如果 Hugging Face Spaces 不稳定或不适合：
1. **Back4app Containers**：更适合 API 服务，256MB RAM
2. **Render**：需要绑卡但更成熟，512MB RAM
3. **自建服务器**：最稳定但需要成本

---

## 📊 监控和维护

### 查看资源使用

在 Space 页面：
1. 点击 "Logs" 标签
2. 观察运行日志
3. 关注错误和警告信息

### 使用统计

在 Claude Relay Service 管理界面：
1. 访问「仪表板」
2. 查看：
   - 总请求数
   - Token 使用量
   - 账户状态
   - API Key 使用情况

### 保活配置

Hugging Face Spaces 的休眠行为不明确，建议配置保活：

**Better Stack 监控**：
1. 注册：https://betterstack.com/
2. 创建 Uptime Monitor：
   ```
   URL: https://你的用户名-claude-relay-service.hf.space/health
   Check Frequency: 30 seconds
   ```
3. 配置告警通知（可选）

详细配置参考：[RENDER_UPSTASH_DEPLOYMENT.md 的保活部分](./RENDER_UPSTASH_DEPLOYMENT.md#-保活配置免费计划必读)

---

## 📚 参考资源

- **项目仓库**：https://github.com/Wei-Shaw/claude-relay-service
- **Hugging Face Spaces 文档**：https://huggingface.co/docs/hub/spaces
- **Hugging Face Docker SDK**：https://huggingface.co/docs/hub/spaces-sdks-docker
- **Upstash 文档**：https://docs.upstash.com/
- **Claude API 文档**：https://docs.anthropic.com/

---

## ✅ 部署检查清单

### 准备阶段
- [ ] Hugging Face 账号已注册（无需信用卡）
- [ ] Upstash Redis 数据库已创建
- [ ] Redis 连接信息已记录
- [ ] 项目文件已准备（Dockerfile, README.md）
- [ ] README.md 包含 Hugging Face 配置头部

### 创建 Space
- [ ] Hugging Face Space 已创建
- [ ] SDK 已选择为 "Docker"
- [ ] Space 名称已设置
- [ ] 可见性已选择（Public/Private）

### 部署阶段
- [ ] 项目文件已推送到 Hugging Face（或上传）
- [ ] 环境变量已配置（JWT_SECRET, ENCRYPTION_KEY, REDIS_*, ADMIN_*）
- [ ] Space 已重启以加载环境变量
- [ ] Docker 构建成功
- [ ] 容器状态为 "Running"

### 验证阶段
- [ ] 健康检查端点返回正常（/health）
- [ ] 可以访问管理界面（/web）
- [ ] 管理员登录成功
- [ ] 已添加至少一个 Claude 账户
- [ ] 已创建至少一个 API Key
- [ ] 客户端配置完成并测试成功

### 监控和维护
- [ ] 已配置保活服务（Better Stack，如需要）
- [ ] 已阅读 Hugging Face 服务条款
- [ ] 理解 Hugging Face Spaces 的限制
- [ ] 准备好备用部署方案（如 Back4app）

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：Space Logs 标签
2. **阅读文档**：
   - 本文档
   - 主 README.md
   - Hugging Face Spaces 文档
3. **提交 Issue**：https://github.com/Wei-Shaw/claude-relay-service/issues
4. **Hugging Face 社区**：https://discuss.huggingface.co/

---

## ⚖️ 免责声明

**重要提示**：

- Hugging Face Spaces 主要用于托管 ML 模型和演示应用
- 将其用于 API 中转服务属于"非典型用途"
- 请仔细阅读并遵守 Hugging Face 服务条款
- 本指南仅供技术学习和测试使用
- 作者不对因使用本指南导致的任何问题负责

**建议**：
- 仅用于个人测试和学习
- 不要用于生产环境或商业用途
- 准备好替代部署方案（Back4app、Render 等）
- 如有疑问，咨询 Hugging Face 官方支持

---

**🎉 完成！**

你已成功在 Hugging Face Spaces 上部署 Claude Relay Service！

**下一步建议**：
1. 测试稳定性（运行 24-48 小时观察）
2. 配置保活服务（如需要）
3. 如果不稳定，考虑迁移到 Back4app 或 Render

现在可以开始使用 Claude Code、Gemini CLI、SillyTavern 等工具了！
