# Claude Relay Service - VPS + Docker Compose 部署指南

本指南详细说明如何在自己的 VPS 上使用 Docker Compose 部署 Claude Relay Service。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [📋 前置准备](#-前置准备)
- [🐳 部署步骤](#-部署步骤)
  - [方案 A：使用内置 Redis](#方案-a使用内置-redis推荐)
  - [方案 B：使用 Upstash Redis](#方案-b使用-upstash-redis)
- [🔒 安全配置](#-安全配置)
- [🌐 域名和 SSL 配置](#-域名和-ssl-配置)
- [🔄 更新和维护](#-更新和维护)
- [📊 监控和日志](#-监控和日志)
- [🐛 故障排查](#-故障排查)
- [✅ 部署检查清单](#-部署检查清单)

---

## 🚀 快速开始

**部署方式**：Docker Compose（一键部署）
**更新方式**：Docker 镜像自动拉取

**预计时间**：10-15分钟

**核心优势**：
- ✅ **完全控制**：自己的服务器，完全掌控
- ✅ **一键部署**：`docker-compose up -d` 即可
- ✅ **自动更新**：可配置 Watchtower 自动更新
- ✅ **高性能**：取决于 VPS 配置，远超免费托管平台
- ✅ **无休眠**：7x24 小时运行

**前置要求**：
- VPS 服务器（推荐 1核2GB 以上）
- 已安装 Docker 和 Docker Compose
- 基础的 Linux 命令行知识

---

## 📋 前置准备

### 1. VPS 服务器要求

**推荐配置**：
```
CPU: 1核 或以上
RAM: 2GB 或以上
存储: 20GB 或以上
系统: Ubuntu 22.04 / Debian 11 / CentOS 8
```

**最低配置**：
```
CPU: 1核
RAM: 1GB（可用，但可能需要优化）
存储: 10GB
```

**推荐 VPS 提供商**（参考）：
- DigitalOcean（$6/月起）
- Vultr（$6/月起）
- Linode（$5/月起）
- 腾讯云轻量应用服务器（¥50/月起）
- 阿里云 ECS（¥80/月起）

### 2. 安装 Docker 和 Docker Compose

#### Ubuntu / Debian

```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

#### CentOS / RHEL

```bash
# 安装必要的包
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

#### 添加当前用户到 docker 组（可选）

```bash
# 避免每次使用 sudo
sudo usermod -aG docker $USER

# 重新登录生效，或执行
newgrp docker

# 验证
docker ps
```

---

## 🐳 部署步骤

### 方案 A：使用内置 Redis（推荐）

这是最简单的方案，Docker Compose 会自动启动 Claude Relay Service 和 Redis。

#### 步骤 1：克隆项目

```bash
# 克隆项目到服务器
git clone https://github.com/Wei-Shaw/claude-relay-service.git
cd claude-relay-service
```

#### 步骤 2：配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件
nano .env
# 或使用 vim
vim .env
```

**必填环境变量**：

```bash
# 🔐 安全密钥（必填 - 需要随机生成）
# 生成方法：openssl rand -hex 64
JWT_SECRET=your-random-jwt-secret-at-least-64-characters-long

# 生成方法：openssl rand -hex 32
ENCRYPTION_KEY=your-random-32-character-key

# 👤 管理员凭据（必填）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# 📊 Redis 配置（使用内置 Redis，无需修改）
# docker-compose.yml 会自动配置
```

**可选环境变量**：

```bash
# 🌐 服务器配置
PORT=3000
BIND_HOST=0.0.0.0  # 如使用反向代理，设置为 127.0.0.1

# 📝 日志配置
LOG_LEVEL=info

# 🛠️ 系统配置
TIMEZONE_OFFSET=8  # 时区偏移（中国 +8）
```

**生成安全密钥**：

```bash
# 生成 JWT_SECRET（128字符）
openssl rand -hex 64

# 生成 ENCRYPTION_KEY（64字符）
openssl rand -hex 32
```

#### 步骤 3：启动服务

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f claude-relay
```

**预期输出**：

```
[+] Running 2/2
 ✔ Container claude-relay-service-redis-1          Started
 ✔ Container claude-relay-service-claude-relay-1   Started
```

#### 步骤 4：验证部署

```bash
# 测试健康检查
curl http://localhost:3000/health

# 预期返回
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "services": {
    "redis": "connected"
  }
}
```

#### 步骤 5：访问管理界面

1. 在浏览器中打开：`http://你的服务器IP:3000/web`
2. 使用管理员凭据登录：
   - 用户名：你设置的 `ADMIN_USERNAME`
   - 密码：你设置的 `ADMIN_PASSWORD`

**⚠️ 安全警告**：
- 默认配置直接暴露 3000 端口到公网
- 强烈建议配置防火墙或反向代理（见后文）

---

### 方案 B：使用 Upstash Redis

如果你想使用 Upstash 的免费 Redis 服务（推荐用于小型部署）。

#### 步骤 1：创建 Upstash Redis

参考 [RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md#第一步创建-upstash-redis-数据库) 的步骤创建 Upstash Redis 数据库。

记录以下信息：
- `REDIS_HOST`：your-endpoint.upstash.io
- `REDIS_PORT`：6379
- `REDIS_PASSWORD`：your-password

#### 步骤 2：修改 docker-compose.yml

```bash
# 编辑 docker-compose.yml
nano docker-compose.yml
```

**修改内容**：

```yaml
services:
  claude-relay:
    image: weishaw/claude-relay-service:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # 🔐 安全配置
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}

      # 👤 管理员凭据
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}

      # 📊 Redis 配置（使用 Upstash）
      - REDIS_HOST=your-endpoint.upstash.io
      - REDIS_PORT=6379
      - REDIS_PASSWORD=your-upstash-password
      - REDIS_ENABLE_TLS=true

      # 🌐 服务器配置
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0

    # 注释掉 depends_on（不需要本地 Redis）
    # depends_on:
    #   - redis

# 注释掉整个 Redis 服务（使用 Upstash）
#  redis:
#    image: redis:7-alpine
#    restart: unless-stopped
#    ...
```

#### 步骤 3：配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env
nano .env
```

确保包含：
```bash
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

#### 步骤 4：启动服务

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f claude-relay

# 验证 Upstash 连接
curl http://localhost:3000/health
```

---

## 🔒 安全配置

### 1. 配置防火墙

#### UFW（Ubuntu/Debian 推荐）

```bash
# 安装 UFW
sudo apt install ufw

# 允许 SSH（重要！）
sudo ufw allow 22/tcp

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 如果直接暴露 3000 端口（不推荐）
sudo ufw allow 3000/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

#### firewalld（CentOS/RHEL）

```bash
# 启动 firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许服务
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 允许端口（如需要）
sudo firewall-cmd --permanent --add-port=3000/tcp

# 重载配置
sudo firewall-cmd --reload

# 查看状态
sudo firewall-cmd --list-all
```

### 2. 配置 Nginx 反向代理（推荐）

#### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 配置反向代理

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/claude-relay
```

**基础配置**（HTTP）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 日志
    access_log /var/log/nginx/claude-relay-access.log;
    error_log /var/log/nginx/claude-relay-error.log;

    # 反向代理到 Docker 容器
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（支持长连接）
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

**启用配置**：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/claude-relay /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

**修改 docker-compose.yml 绑定地址**：

```yaml
services:
  claude-relay:
    ports:
      - "127.0.0.1:3000:3000"  # 只绑定到本地
```

重启服务：
```bash
docker-compose down
docker-compose up -d
```

现在可以通过 `http://your-domain.com` 访问服务。

---

## 🌐 域名和 SSL 配置

### 1. 配置域名

在你的域名提供商（如 Cloudflare、阿里云）配置 DNS：

```
类型: A
名称: @ 或 api（子域名）
值: 你的VPS IP地址
TTL: 自动或300秒
```

等待 DNS 生效（1-10分钟）。

### 2. 使用 Certbot 申请免费 SSL 证书

#### 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 申请证书

```bash
# 自动配置 SSL
sudo certbot --nginx -d your-domain.com

# 或者多个域名
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**按提示操作**：
1. 输入邮箱地址
2. 同意服务条款
3. 选择是否重定向 HTTP 到 HTTPS（推荐选择 2）

#### 自动续期

Certbot 会自动配置 cron 任务续期证书。验证：

```bash
# 测试续期
sudo certbot renew --dry-run

# 查看 cron 任务
sudo systemctl list-timers | grep certbot
```

#### 验证 HTTPS

访问 `https://your-domain.com/health`，应该看到 🔒 图标。

---

## 🔄 更新和维护

### 方法 1：手动更新

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 查看日志
docker-compose logs -f claude-relay
```

### 方法 2：使用 Watchtower 自动更新

#### 添加 Watchtower 到 docker-compose.yml

```bash
nano docker-compose.yml
```

**添加以下内容**：

```yaml
services:
  # ... 现有服务 ...

  # 🔄 Watchtower - 自动更新 Docker 镜像
  watchtower:
    image: containrrr/watchtower:latest
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true  # 清理旧镜像
      - WATCHTOWER_POLL_INTERVAL=3600  # 检查间隔（秒）
      - WATCHTOWER_INCLUDE_STOPPED=true
      - WATCHTOWER_REVIVE_STOPPED=false
      - TZ=Asia/Shanghai  # 时区
    command: --label-enable  # 只更新带标签的容器
    networks:
      - claude-relay-network
```

**给 claude-relay 服务添加标签**：

```yaml
services:
  claude-relay:
    image: weishaw/claude-relay-service:latest
    labels:
      - "com.centurylinklabs.watchtower.enable=true"  # 启用自动更新
    # ... 其他配置 ...
```

**启动 Watchtower**：

```bash
docker-compose up -d watchtower
```

**Watchtower 配置说明**：
- `WATCHTOWER_POLL_INTERVAL=3600`：每小时检查一次更新
- `WATCHTOWER_CLEANUP=true`：自动清理旧镜像
- `--label-enable`：只更新带 `watchtower.enable=true` 标签的容器

**查看 Watchtower 日志**：

```bash
docker-compose logs -f watchtower
```

### 方法 3：定时任务自动更新

```bash
# 创建更新脚本
nano ~/update-claude-relay.sh
```

**脚本内容**：

```bash
#!/bin/bash
cd /path/to/claude-relay-service
docker-compose pull
docker-compose up -d
docker image prune -f
echo "Updated at $(date)" >> /var/log/claude-relay-update.log
```

**设置权限**：

```bash
chmod +x ~/update-claude-relay.sh
```

**添加 cron 任务**：

```bash
crontab -e
```

**添加以下行**（每天凌晨 3 点更新）：

```cron
0 3 * * * /home/your-username/update-claude-relay.sh
```

---

## 📊 监控和日志

### 1. 查看服务状态

```bash
# 查看所有服务
docker-compose ps

# 查看资源使用
docker stats

# 查看特定容器状态
docker inspect claude-relay-service-claude-relay-1
```

### 2. 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs -f claude-relay
docker-compose logs -f redis
```

### 3. 持久化日志

日志已挂载到本地目录：

```bash
# 应用日志
tail -f logs/claude-relay-combined.log
tail -f logs/claude-relay-error.log

# 按日期查看
ls -lh logs/
```

### 4. 启用监控（可选）

**启动 Prometheus + Grafana**：

```bash
# docker-compose.yml 中已包含监控服务
# 使用 profile 启动
docker-compose --profile monitoring up -d

# 访问监控界面
# Prometheus: http://your-server-ip:9090
# Grafana: http://your-server-ip:3001
```

**Grafana 默认凭据**：
- 用户名：admin
- 密码：在 .env 中设置 `GRAFANA_ADMIN_PASSWORD`

### 5. Redis 监控（可选）

```bash
# 启动 Redis Commander
docker-compose --profile monitoring up -d redis-commander

# 访问 Redis 管理界面
# http://127.0.0.1:8081
```

---

## 🐛 故障排查

### 服务无法启动

**查看详细日志**：

```bash
docker-compose logs claude-relay
```

**常见错误**：

```
Error: Redis connection failed
→ 检查 Redis 是否正常运行
→ 如使用 Upstash，检查连接信息和 REDIS_ENABLE_TLS=true

Error: JWT_SECRET or ENCRYPTION_KEY is not set
→ 检查 .env 文件是否正确配置
→ 确认环境变量已加载

Error: Port 3000 already in use
→ 检查是否有其他服务占用 3000 端口
→ 修改 PORT 环境变量或停止占用端口的服务
```

### Redis 连接问题

**检查 Redis 状态**：

```bash
# 查看 Redis 容器
docker-compose ps redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
# 预期返回：PONG

# 查看 Redis 日志
docker-compose logs redis
```

**如使用 Upstash Redis**：

```bash
# 测试 Upstash 连接
redis-cli -h your-endpoint.upstash.io -p 6379 -a password --tls
```

### 无法访问管理界面

**检查端口映射**：

```bash
# 查看容器端口
docker-compose ps

# 检查端口监听
sudo netstat -tlnp | grep 3000
```

**检查防火墙**：

```bash
# UFW
sudo ufw status

# 如果被阻止，允许端口
sudo ufw allow 3000/tcp
```

**检查 Nginx 反向代理**：

```bash
# 测试配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 容器频繁重启

**查看容器日志**：

```bash
docker-compose logs --tail=200 claude-relay
```

**检查资源使用**：

```bash
# 查看内存和 CPU 使用
docker stats

# 查看服务器资源
free -h
df -h
```

**常见原因**：
- 内存不足（OOM Killer）
- 配置错误导致崩溃
- 健康检查失败

### 数据丢失

**检查数据挂载**：

```bash
# 查看挂载目录
ls -lh data/
ls -lh redis_data/

# 检查权限
ls -ld data/ redis_data/
```

**Redis 数据持久化**：

```bash
# 查看 Redis 持久化配置
docker-compose exec redis redis-cli CONFIG GET save
docker-compose exec redis redis-cli CONFIG GET appendonly

# 手动触发保存
docker-compose exec redis redis-cli SAVE
```

---

## 🔧 高级配置

### 1. 自定义端口

```yaml
# docker-compose.yml
services:
  claude-relay:
    ports:
      - "8080:3000"  # 将容器的 3000 映射到主机 8080
```

### 2. 限制资源使用

```yaml
services:
  claude-relay:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. 配置网络模式

```yaml
services:
  claude-relay:
    network_mode: "host"  # 使用主机网络（性能更好，但端口映射无效）
```

### 4. 数据备份

**备份脚本**：

```bash
#!/bin/bash
BACKUP_DIR="/backup/claude-relay-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 备份 Redis 数据
docker-compose exec -T redis redis-cli SAVE
cp -r redis_data/ $BACKUP_DIR/

# 备份应用数据
cp -r data/ $BACKUP_DIR/
cp -r logs/ $BACKUP_DIR/

# 备份配置
cp .env $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/

# 压缩
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

**定时备份**（cron）：

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-script.sh
```

---

## 📚 常见问题

### Q1: 需要多大的 VPS？

**A**: 取决于使用规模：

- **1-5 人**：1核1GB（最低）
- **5-10 人**：1核2GB（推荐）
- **10-20 人**：2核4GB
- **20+ 人**：4核8GB 或更高

### Q2: Docker Compose 和托管平台相比如何？

**A**: 对比：

| 特性 | Docker Compose | 托管平台 |
|------|---------------|---------|
| 成本 | VPS 费用（$5-20/月） | $0-7/月 |
| 控制 | 完全控制 | 受限 |
| 性能 | 取决于 VPS | 有限 |
| 维护 | 需要自己管理 | 平台管理 |

### Q3: 如何迁移数据到新服务器？

**A**: 步骤：

```bash
# 在旧服务器
docker-compose exec redis redis-cli SAVE
tar -czf backup.tar.gz data/ redis_data/ .env docker-compose.yml

# 传输到新服务器
scp backup.tar.gz user@new-server:/path/to/

# 在新服务器
tar -xzf backup.tar.gz
docker-compose up -d
```

---

## ✅ 部署检查清单

### 准备阶段
- [ ] VPS 已准备（1核2GB 以上）
- [ ] Docker 和 Docker Compose 已安装
- [ ] 防火墙已配置（SSH、HTTP、HTTPS）
- [ ] 域名已配置（可选）

### 部署阶段
- [ ] 项目已克隆到服务器
- [ ] .env 文件已配置（JWT_SECRET, ENCRYPTION_KEY, 管理员凭据）
- [ ] docker-compose.yml 已根据需求调整（内置 Redis 或 Upstash）
- [ ] 服务已启动（docker-compose up -d）
- [ ] 健康检查通过（/health 端点）

### 安全配置
- [ ] 防火墙已配置
- [ ] Nginx 反向代理已配置（推荐）
- [ ] SSL 证书已申请（推荐）
- [ ] 服务绑定到 127.0.0.1（如使用反向代理）

### 验证阶段
- [ ] 可以访问管理界面
- [ ] 管理员登录成功
- [ ] 已添加 Claude 账户
- [ ] 已创建 API Key
- [ ] 客户端配置并测试成功

### 维护配置
- [ ] 日志查看正常
- [ ] 自动更新已配置（Watchtower 或 cron）
- [ ] 数据备份脚本已配置（推荐）
- [ ] 监控已配置（可选）

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：`docker-compose logs -f`
2. **阅读文档**：本文档和主 README.md
3. **提交 Issue**：https://github.com/Wei-Shaw/claude-relay-service/issues
4. **Docker 文档**：https://docs.docker.com/

---

**🎉 恭喜！你已成功在 VPS 上部署 Claude Relay Service！**

现在你拥有了一个完全可控、高性能的 Claude API 中转服务！
