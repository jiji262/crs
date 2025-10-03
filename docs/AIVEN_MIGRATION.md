# Aiven for Valkey 迁移指南

**从 Upstash Redis 迁移到 Aiven for Valkey 的完整教程**

---

## 🎯 为什么选择 Aiven？

### Upstash vs Aiven 对比

| 对比项 | Upstash 免费版 | Aiven 免费版 |
|--------|---------------|-------------|
| 💾 **内存** | 250MB | **1GB (4倍)** |
| 📊 **存储** | 256MB | **5GB (20倍)** |
| 🔄 **请求限制** | 50万次/天 (≈5.8次/秒) | **无限制** |
| ⚡ **TPS** | 较低 | 较高 |
| 🎁 **资源隔离** | 共享 | **独立虚拟机** |
| 💳 **需要绑卡** | ❌ | ❌ |
| ⏰ **时间限制** | 永久 | 永久 |
| 🔧 **功能** | 基础 | **完整 (加密/备份/监控)** |

**核心优势：**
- ✅ **无请求次数限制** - 不再担心超出配额
- ✅ **4倍内存** - 支持更多数据和并发
- ✅ **独立资源** - 性能稳定可预测
- ✅ **100% Redis 兼容** - 基于 Valkey (Redis 分支)

---

## 📋 前置要求

- Render 部署的 Claude Relay Service 实例
- 当前使用 Upstash Redis
- 5-10 分钟迁移时间
- **不需要信用卡**

---

## 🚀 迁移步骤

### 步骤 1: 注册 Aiven 账号

1. **访问 Aiven 官网**
   - 地址：https://aiven.io/
   - 点击右上角 **"Start free"** 或 **"Sign up"**

2. **选择注册方式**
   - 推荐使用 GitHub 快速登录
   - 或使用邮箱注册

3. **完成注册**
   - ✅ **无需提供信用卡信息**
   - 填写基本信息即可

---

### 步骤 2: 创建 Valkey 服务

1. **进入控制台**
   - 登录后会自动跳转到 Dashboard
   - 点击 **"Create service"** 按钮

2. **选择服务类型**
   - 在服务列表中找到 **"Valkey"**
   - Valkey 是 Redis 的开源分支，100% 兼容 Redis 协议

3. **配置服务**

   **3.1 选择云服务商**
   - AWS / Google Cloud / Azure 任选
   - 推荐选择与 Render 实例相同或相近的区域

   **3.2 选择区域**
   - 如果 Render 在美国：选择 `us-east-1` (美国东部)
   - 如果在欧洲：选择 `eu-west-1` (爱尔兰)
   - 如果在亚太：选择 `ap-southeast-1` (新加坡)

   💡 **提示**: 选择距离 Render 实例最近的区域可降低延迟

   **3.3 选择套餐**
   - 滚动到底部，选择 **"Free"** 套餐
   - 配置：1 CPU | 1GB RAM | 5GB 存储
   - 确认 **"$0.00/month"** 显示

4. **配置服务名称**
   - 服务名称：`crs-valkey` (或自定义)
   - 项目名称：使用默认或创建新项目

5. **创建服务**
   - 点击 **"Create service"** 按钮
   - ⏱️ 等待 2-3 分钟，服务状态变为 **"Running"**

---

### 步骤 3: 获取连接信息

1. **进入服务详情页**
   - 在 Dashboard 点击刚创建的服务名称

2. **查看连接信息**
   - 找到 **"Connection information"** 部分
   - 会看到以下信息：

   ```
   Service URI: rediss://default:password@host.aivencloud.com:port
   Host: your-service-name.aivencloud.com
   Port: 12345
   User: default
   Password: **********************
   ```

3. **复制连接参数**（下一步需要用到）
   - **Host**: 完整域名（如 `crs-valkey-project.aivencloud.com`）
   - **Port**: 端口号（通常是 5 位数）
   - **Password**: 点击眼睛图标显示并复制

---

### 步骤 4: 更新 Render 环境变量

1. **登录 Render 控制台**
   - 访问：https://dashboard.render.com/
   - 找到你的 Claude Relay Service 实例

2. **进入环境变量配置**
   - 点击左侧菜单 **"Environment"**
   - 找到 Redis 相关配置

3. **更新 Redis 配置**

   **删除旧的 Upstash 配置：**
   ```bash
   REDIS_HOST=old-upstash-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=old-upstash-password
   ```

   **添加新的 Aiven 配置：**
   ```bash
   # 📊 Redis 配置（使用 Aiven Valkey）
   REDIS_HOST=your-service-name.aivencloud.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your-aiven-password
   REDIS_ENABLE_TLS=true
   ```

   💡 **重要提示**：
   - `REDIS_HOST`: 使用 Aiven 提供的完整域名
   - `REDIS_PORT`: 使用 Aiven 提供的端口（不是 6379）
   - `REDIS_PASSWORD`: 使用 Aiven 的密码
   - `REDIS_ENABLE_TLS`: **必须设置为 `true`**（Aiven 强制 TLS）

4. **保存配置**
   - 点击 **"Save Changes"** 按钮
   - Render 会自动重启服务

---

### 步骤 5: 验证迁移

1. **等待服务重启**
   - Render 重启通常需要 1-2 分钟
   - 观察 Logs 中是否有错误

2. **检查日志**
   - 在 Render 控制台查看 **"Logs"** 标签
   - 查找 Redis 连接日志：

   ```
   ✅ 成功日志示例：
   [INFO] Redis client ready
   [INFO] Successfully connected to Redis

   ❌ 失败日志示例：
   [ERROR] Redis connection failed
   [ERROR] ECONNREFUSED
   ```

3. **访问 Web 管理界面**
   - 打开你的服务 URL：`https://your-app.onrender.com/web`
   - 尝试登录管理后台
   - 检查是否能看到现有数据

4. **测试 API 功能**
   - 使用现有 API Key 发送测试请求
   - 验证 API 转发功能正常

---

### 步骤 6: 数据迁移（可选）

**注意**: 迁移到新 Redis 实例后，需要重新配置：

#### 需要重新创建的数据

由于 Redis 是会话存储，以下数据会丢失：

1. **管理员账户** - 需要重新设置
2. **API Keys** - 需要重新创建
3. **Claude 账户** - 需要重新添加（重新 OAuth 授权）
4. **使用统计** - 历史统计数据会丢失

#### 快速恢复步骤

**方法 1: 使用初始化脚本（推荐）**

在 Render 环境变量中重新设置：
```bash
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password
```

重启后会自动创建管理员账户。

**方法 2: 手动数据迁移**

如果需要保留原有数据：

1. **导出 Upstash 数据**（需要 Redis CLI）
   ```bash
   # 连接到 Upstash
   redis-cli -h old-host.upstash.io -p 6379 -a password --tls

   # 导出所有 keys
   redis-cli -h old-host.upstash.io -p 6379 -a password --tls --scan > keys.txt

   # 导出数据（示例）
   redis-cli -h old-host.upstash.io -p 6379 -a password --tls --dump > dump.rdb
   ```

2. **导入到 Aiven**
   ```bash
   # 连接到 Aiven
   redis-cli -h your-service.aivencloud.com -p 12345 -a password --tls

   # 导入数据
   cat dump.rdb | redis-cli -h your-service.aivencloud.com -p 12345 -a password --tls --pipe
   ```

💡 **简化建议**: 对于个人使用或小团队，直接重新配置更快捷。

---

## 🔍 故障排除

### 问题 1: 连接失败 - TLS 错误

**错误日志：**
```
[ERROR] Redis connection failed: Error: self signed certificate
```

**解决方案：**
```bash
# 确保设置了 TLS
REDIS_ENABLE_TLS=true

# 如果使用 URI 连接，确保使用 rediss:// (双 s)
REDIS_URI=rediss://default:password@host:port
```

---

### 问题 2: 连接超时

**错误日志：**
```
[ERROR] Redis connection timeout
```

**检查清单：**
- ✅ 确认 Aiven 服务状态为 "Running"
- ✅ 确认 Render 区域与 Aiven 区域相近
- ✅ 检查防火墙规则（Aiven 默认允许所有 IP）
- ✅ 确认端口号正确（Aiven 不使用标准 6379 端口）

---

### 问题 3: 认证失败

**错误日志：**
```
[ERROR] Redis authentication failed
```

**解决方案：**
```bash
# 重新复制密码（确保没有多余空格）
# 在 Aiven 控制台点击密码旁边的眼睛图标
# 复制完整密码到 Render 环境变量

REDIS_PASSWORD=正确的密码（无空格）
```

---

### 问题 4: 性能问题

**症状：**
- API 响应变慢
- Web 界面加载缓慢

**优化建议：**

1. **检查区域延迟**
   ```bash
   # 测试延迟
   ping your-service.aivencloud.com
   ```

2. **选择更近的区域**
   - 在 Aiven 控制台重新创建服务
   - 选择距离 Render 更近的区域

3. **检查连接数**
   - Aiven 控制台查看 **"Metrics"**
   - 确认没有达到连接数上限

---

## 📊 性能监控

### Aiven 控制台监控

1. **访问 Metrics 页面**
   - 服务详情页 → **"Metrics"** 标签

2. **关键指标**
   - **CPU Usage**: 应保持在 70% 以下
   - **Memory Usage**: 监控是否接近 1GB
   - **Connections**: 当前连接数
   - **Operations/sec**: 每秒操作数

3. **设置告警**
   - 服务详情页 → **"Integrations"** → **"Alerts"**
   - 添加邮件通知

---

## 🎯 迁移后优化建议

### 1. 取消 Upstash 订阅

迁移成功后，可以删除 Upstash 实例：

1. 登录 Upstash 控制台
2. 选择旧的 Redis 实例
3. 点击 **"Delete"** 删除

### 2. 更新文档和配置

在团队文档中更新：
- Redis 连接信息
- 故障排查步骤
- 备份恢复流程

### 3. 性能基准测试

```bash
# 使用 redis-benchmark 测试
redis-benchmark -h your-service.aivencloud.com -p 12345 -a password --tls -t set,get -n 10000 -q
```

---

## 🔒 安全最佳实践

### 1. IP 白名单（可选）

Aiven 支持 IP 白名单：

1. 服务详情页 → **"Overview"** → **"Allowed IP Addresses"**
2. 添加 Render 的出站 IP 地址
3. 点击 **"Save changes"**

### 2. 定期备份

Aiven 免费版包含自动备份：

- 备份频率: 每 24 小时
- 保留时间: 2 天
- 查看备份: 服务详情页 → **"Backups"**

### 3. 密码管理

- ✅ 定期更换密码（每 90 天）
- ✅ 使用强密码（至少 32 字符）
- ✅ 不要在日志中打印密码

---

## 📈 扩展升级路径

### 何时需要升级？

当出现以下情况时考虑升级：

1. **内存不足** - 数据接近 1GB
2. **性能瓶颈** - CPU 持续 >80%
3. **需要高可用** - 需要主从复制

### Aiven 付费套餐

| 套餐 | 内存 | 存储 | 价格/月 |
|------|------|------|---------|
| Free | 1GB | 5GB | $0 |
| Startup-4 | 4GB | 40GB | ~$35 |
| Business-8 | 8GB | 100GB | ~$90 |

💡 **提示**: 免费版足够支撑中小型项目（日均 10-100 万次请求）

---

## 📞 技术支持

### Aiven 支持渠道

- 📧 邮件支持: support@aiven.io
- 📚 文档: https://aiven.io/docs
- 💬 社区: https://aiven.io/community

### 项目支持

- GitHub Issues: https://github.com/your-repo/issues
- 项目文档: 查看 `docs/` 目录

---

## ✅ 迁移检查清单

完成以下检查确保迁移成功：

- [ ] Aiven 账号已注册（无需信用卡）
- [ ] Valkey 服务已创建并运行
- [ ] 连接信息已复制（Host / Port / Password）
- [ ] Render 环境变量已更新
- [ ] `REDIS_ENABLE_TLS=true` 已设置
- [ ] Render 服务已重启
- [ ] 日志中无 Redis 连接错误
- [ ] Web 管理界面可访问
- [ ] API 测试请求成功
- [ ] 管理员账户已重新创建
- [ ] API Keys 已重新添加
- [ ] Claude 账户已重新配置
- [ ] Upstash 旧实例已删除

---

## 🎉 迁移完成！

恭喜！你已成功从 Upstash 迁移到 Aiven for Valkey。

**获得的好处：**
- ✅ **4倍内存** - 从 250MB → 1GB
- ✅ **无请求限制** - 不再担心配额
- ✅ **更高性能** - 独立虚拟机资源
- ✅ **完整功能** - 备份、监控、告警
- ✅ **永久免费** - 无时间限制

享受更稳定、更强大的 Redis 服务！🚀
