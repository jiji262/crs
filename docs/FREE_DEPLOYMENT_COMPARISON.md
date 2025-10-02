# 免费部署方案对比 - Claude Relay Service

本文档对比所有可用的免费部署方案，帮助你选择最适合的平台。

## 📊 快速对比表

| 平台 | 需要绑卡 | CPU | RAM | 流量 | 休眠机制 | 域名 | 推荐度 |
|------|---------|-----|-----|------|---------|------|--------|
| **Back4app** | ❌ 否 | 0.25 | 256MB | 100GB | ❓ 未知 | ❌ 60分钟临时 | ⭐⭐ |
| **Hugging Face** | ❌ 否 | 变动 | 变动 | 无限 | ⚠️ 可能 | ✅ 永久 | ⭐⭐⭐ |
| **Northflank** | ⚠️ 需验证 | 变动 | 变动 | 包含 | ❌ 不休眠 | ✅ 自定义 | ⭐⭐⭐⭐ |
| **Render** | ✅ 是 | 0.5 | 512MB | 100GB | ✅ 15分钟 | ✅ 永久 | ⭐⭐⭐⭐⭐ |
| Upstash Redis | ❌ 否 | - | 256MB | 500K命令 | ❌ 否 | - | ⭐⭐⭐⭐⭐ |

---

## 🎯 推荐方案总结

### 方案 1：Back4app + Upstash（⚠️ 不推荐，域名仅 60 分钟）

**优势**：
- ✅ 完全免费，不需要信用卡
- ✅ 专为容器服务设计
- ✅ GitHub 集成，自动部署
- ✅ 100GB 流量/月（充足）

**重大劣势**：
- ❌ **默认域名仅 60 分钟有效**（严重问题）
- ❌ **自定义域名需要付费**（$5/月）
- ❌ **无法用于长期免费部署**
- ⚠️ 256MB RAM（比 Render 少一半）
- ⚠️ 0.25 CPU（较弱）
- ⚠️ 社区较小，问题解决可能较难

**适合场景**：
- ❌ **不推荐用于任何长期部署**
- ✅ 仅适合临时测试（< 60 分钟）
- ✅ 或愿意付费升级到 $5/月

**结论**：**由于域名限制，不推荐使用免费套餐**

**部署指南**：[BACK4APP_DEPLOYMENT.md](./BACK4APP_DEPLOYMENT.md)

---

### 方案 2：Hugging Face Spaces + Upstash（推荐，不需要绑卡）

**优势**：
- ✅ 完全免费，不需要信用卡
- ✅ 支持完整的 Docker 环境
- ✅ 大型社区支持
- ✅ 无流量限制
- ✅ 灵活的配置选项

**劣势**：
- ⚠️ 主要面向 ML 应用，API 服务属于"非典型用途"
- ⚠️ 可能违反服务条款（需自行确认）
- ⚠️ 资源不保证（根据平台负载动态分配）
- ⚠️ 容器重启后数据丢失（需外部 Redis）
- ⚠️ 稳定性未知
- ⚠️ 可能有不明确的使用限制

**适合场景**：
- 个人测试和实验
- 临时使用（1-2周）
- 学习 Docker 部署
- 作为备用方案

**不适合**：
- 生产环境
- 商业用途
- 需要高稳定性的场景
- 多用户长期使用

**部署指南**：[HUGGINGFACE_DEPLOYMENT.md](./HUGGINGFACE_DEPLOYMENT.md)

---

### 方案 3：Render + Upstash（最成熟，需要绑卡）

**优势**：
- ✅ 512MB RAM（最充足）
- ✅ 0.5 CPU（更强）
- ✅ 专业的 PaaS 平台
- ✅ 文档完善，社区成熟
- ✅ Docker 镜像自动部署
- ✅ 零停机更新
- ✅ 保活方案成熟（Better Stack）

**劣势**：
- ⚠️ 需要绑定信用卡（但免费计划不会自动扣费）
- ⚠️ 15 分钟无活动自动休眠
- ⚠️ 冷启动需要 30-50 秒

**适合场景**：
- 生产环境
- 3-10 人团队使用
- 需要稳定性和可靠性
- 愿意绑信用卡（但不想付费）

**部署指南**：[RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md)

---

## 📋 详细对比

### 1. Back4app Containers

#### 资源配额
```
CPU: 0.25 共享
RAM: 256 MB
存储: 临时（容器重启后丢失）
流量: 100 GB/月
并发: 未明确说明
```

#### 特性
- ✅ Docker 支持
- ✅ GitHub 集成自动部署
- ✅ 零停机部署
- ✅ 环境变量配置
- ✅ 实时日志查看
- ⚠️ Region 选择未明确
- ⚠️ 休眠机制未明确
- ⚠️ 持久存储需要付费

#### 部署流程
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动构建 Docker 镜像
4. 自动部署（3-5 分钟）

#### 保活需求
- ❓ **需要测试**：部署后测试 15分钟、1小时、8小时闲置
- 如果会休眠，使用 Better Stack 监控

#### 升级选项
- Shared Plan: $5/月（0.5 CPU, 512MB RAM）
- Dedicated Plan: $20/月（1 CPU, 2GB RAM）

#### 评分
- **易用性**: ⭐⭐⭐⭐ (4/5)
- **稳定性**: ⭐⭐⭐ (3/5，待测试)
- **性能**: ⭐⭐⭐ (3/5，256MB 有限)
- **文档**: ⭐⭐⭐ (3/5，不够详细)
- **总分**: ⭐⭐⭐⭐ (推荐，不需要绑卡的最佳选择)

---

### 2. Hugging Face Spaces (Docker)

#### 资源配额
```
CPU: 动态分配（根据平台负载）
RAM: 动态分配（根据平台负载）
存储: 临时（容器重启后丢失）
       /data 目录可持久化（需付费）
流量: 无明确限制
并发: 未明确说明
```

#### 特性
- ✅ 完整的 Docker 环境
- ✅ Git 推送自动部署
- ✅ Web 界面上传文件
- ✅ 环境变量/Secrets 配置
- ✅ 实时日志查看
- ✅ 可升级到 GPU 实例
- ⚠️ 主要面向 ML 应用
- ⚠️ API 服务属于非典型用途
- ⚠️ 资源不保证

#### 部署流程
1. 创建 Space（选择 Docker SDK）
2. 准备 README.md（包含 Hugging Face 配置）
3. 推送代码（Git 或 Web 上传）
4. 配置环境变量
5. 自动构建和部署（3-5 分钟）

#### 保活需求
- ❓ **休眠机制不明确**
- 建议配置 Better Stack 监控保活

#### 升级选项
- CPU Upgrade: 约 $0.03/小时
- GPU T4: 约 $0.60/小时
- Persistent Storage: 约 $5/月

#### 使用注意
⚠️ **重要警告**：
- Hugging Face Spaces 主要用于 ML 模型托管
- 用于 API 中转服务可能违反服务条款
- 建议仔细阅读服务条款：https://huggingface.co/terms-of-service
- 仅推荐用于测试和学习

#### 评分
- **易用性**: ⭐⭐⭐⭐ (4/5)
- **稳定性**: ⭐⭐ (2/5，用途不匹配)
- **性能**: ⭐⭐⭐ (3/5，资源不保证)
- **文档**: ⭐⭐⭐⭐ (4/5，ML 方向文档好)
- **总分**: ⭐⭐⭐ (备选，有服务条款风险)

---

### 3. Render (Free Plan)

#### 资源配额
```
CPU: 0.5 共享
RAM: 512 MB
存储: 临时（容器重启后丢失）
流量: 100 GB/月
并发: 未明确说明，但相对充足
月配额: 750 小时（足够全月运行）
```

#### 特性
- ✅ 专业的 PaaS 平台
- ✅ Docker 镜像自动部署
- ✅ Auto-Deploy（自动拉取新镜像）
- ✅ 零停机滚动更新
- ✅ 健康检查配置
- ✅ Region 选择明确（4个区域）
- ✅ 自定义域名支持
- ✅ 免费 SSL 证书
- ⚠️ 15 分钟无活动自动休眠
- ⚠️ 冷启动 30-50 秒

#### 部署流程
1. 选择 Docker 镜像部署
2. 配置环境变量
3. 启用 Auto-Deploy
4. 自动部署（1-2 分钟）

#### 保活需求
- ✅ **必须保活**：15 分钟无活动休眠
- 推荐方案：Better Stack（30秒检查间隔）
- 详细指南：[RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md#-保活配置免费计划必读)

#### 升级选项
- Starter Plan: $7/月（无休眠，0.5 CPU, 512MB RAM）
- Standard Plan: $25/月（1 CPU, 2GB RAM）

#### 评分
- **易用性**: ⭐⭐⭐⭐⭐ (5/5)
- **稳定性**: ⭐⭐⭐⭐⭐ (5/5)
- **性能**: ⭐⭐⭐⭐ (4/5，512MB 充足)
- **文档**: ⭐⭐⭐⭐⭐ (5/5)
- **总分**: ⭐⭐⭐⭐⭐ (最成熟，但需要绑卡)

---

### 4. Upstash Redis（推荐作为所有方案的 Redis 提供商）

#### 资源配额
```
存储: 256 MB
命令数: 500,000 命令/月
连接数: 1,000
并发命令: 1,000
数据持久化: 自动持久化到块存储
区域: 全球多个区域可选
TLS: 默认启用
```

#### 特性
- ✅ 完全免费，不需要信用卡
- ✅ 500K 命令/月（非常充足）
- ✅ 数据自动持久化，永不丢失
- ✅ 始终在线，不会休眠
- ✅ TLS 加密连接
- ✅ REST API 支持（Serverless 友好）
- ✅ 与 ioredis 完全兼容

#### 对比 Redis Cloud Free
```
Upstash Free:
- 256MB 存储
- 500K 命令/月
- 无需信用卡

Redis Cloud Free:
- 30MB 存储（少 8 倍）
- 30 连接（少 33 倍）
- 无需信用卡
```

**结论**：Upstash 免费计划远优于 Redis Cloud

#### 评分
- **易用性**: ⭐⭐⭐⭐⭐ (5/5)
- **稳定性**: ⭐⭐⭐⭐⭐ (5/5)
- **性能**: ⭐⭐⭐⭐⭐ (5/5)
- **慷慨度**: ⭐⭐⭐⭐⭐ (5/5)
- **总分**: ⭐⭐⭐⭐⭐ (所有方案的最佳 Redis 选择)

---

## 🎯 选择建议

### 场景 1：坚决不想绑信用卡

**推荐顺序**：
1. **Hugging Face + Upstash**（首选）
   - ✅ 永久域名
   - ✅ 不需要信用卡
   - ✅ 支持完整 Docker
   - ⚠️ 注意服务条款限制
   - ⚠️ 稳定性需要测试

2. ~~**Back4app + Upstash**~~（不推荐）
   - ❌ 域名仅 60 分钟有效
   - ❌ 除非愿意付费 $5/月

**部署策略**：
- 直接使用 Hugging Face Spaces
- 测试 1-2 周，观察稳定性
- 如果不稳定，考虑咬牙绑卡用 Render

---

### 场景 2：可以接受绑信用卡（但不想付费）

**推荐**：
- **Render + Upstash**（最佳选择）
  - 最成熟稳定的免费方案
  - 512MB RAM 更充足
  - 配合 Better Stack 保活
  - 社区成熟，问题容易解决

---

### 场景 3：小规模使用（1-3人）

**推荐**：
- **Back4app + Upstash**
  - 256MB RAM 对于小规模足够
  - 完全免费，无需绑卡
  - 如果会休眠，配置保活

---

### 场景 4：中等规模使用（3-10人）

**推荐**：
- **Render + Upstash**（免费计划）
  - 512MB RAM 更充足
  - 更稳定可靠
  - 配置 Better Stack 保活

**或升级付费**：
- Render Starter ($7/月) + Upstash Free
  - 无休眠
  - 更快响应
  - 更高可用性

---

### 场景 5：生产环境或商业用途

**推荐**：
- **Render Starter ($7/月) + Upstash Pay-as-you-go**
  - 无休眠，始终在线
  - 更多资源，更高性能
  - 99.9% SLA
  - 专业支持

**不推荐免费方案用于生产环境**：
- Back4app：256MB RAM 可能不够，稳定性未验证
- Hugging Face：服务条款限制，稳定性未知
- Render Free：休眠机制影响用户体验

---

## 💰 成本对比

### 完全免费方案

| 方案 | 月成本 | CPU | RAM | 流量 | 需要绑卡 | 推荐度 |
|------|--------|-----|-----|------|---------|--------|
| Back4app + Upstash | $0 | 0.25 | 256MB | 100GB | ❌ | ⭐⭐⭐⭐ |
| Hugging Face + Upstash | $0 | 变动 | 变动 | 无限 | ❌ | ⭐⭐⭐ |
| Render + Upstash | $0 | 0.5 | 512MB | 100GB | ✅ | ⭐⭐⭐⭐⭐ |

### 推荐付费方案（生产环境）

| 方案 | 月成本 | CPU | RAM | 流量 | 休眠 | 推荐度 |
|------|--------|-----|-----|------|------|--------|
| Render Starter + Upstash | $7 | 0.5 | 512MB | 100GB | ❌ | ⭐⭐⭐⭐⭐ |
| Back4app Shared + Upstash | $5 | 0.5 | 512MB | 100GB | ❓ | ⭐⭐⭐⭐ |

---

## 🔧 保活方案对比

### Better Stack（推荐）

**优势**：
- ✅ 免费 10 个监控项
- ✅ 30 秒检查间隔（最快）
- ✅ 全球多节点监控
- ✅ 邮件/Slack/Webhook 告警
- ✅ 自动生成状态页
- ✅ 响应时间统计

**配置**：
```
URL: https://your-service-url/health
Check Frequency: 30 seconds
Expected Status Code: 200
```

**月请求数**：
```
30秒 × 2次/分钟 × 60分钟 × 24小时 × 30天 = 86,400次/月
远低于 Render 750小时月配额
```

**注册**：https://betterstack.com/

---

### UptimeRobot（备选）

**优势**：
- ✅ 免费 50 个监控项
- ⚠️ 5 分钟检查间隔（较慢）
- ✅ 邮件告警
- ⚠️ 功能较基础

**配置**：
```
Monitor Type: HTTP(s)
URL: https://your-service-url/health
Monitoring Interval: 5 minutes
```

**注册**：https://uptimerobot.com/

---

### GitHub Actions（不推荐）

**劣势**：
- ⚠️ 有使用限制（2000 分钟/月）
- ⚠️ 需要额外维护
- ⚠️ 不如专业监控可靠
- ⚠️ 没有告警和统计功能

**结论**：不推荐，使用 Better Stack 更好

---

## 🧪 测试清单

### Back4app 测试（重要）

由于 Back4app 休眠机制不明确，**必须测试**：

1. **15 分钟闲置测试**
   ```bash
   # 停止访问 15 分钟后
   time curl https://your-app.back4app.io/health
   # 观察响应时间：< 1秒 = 正常，> 10秒 = 可能休眠
   ```

2. **1 小时闲置测试**
   ```bash
   # 停止访问 1 小时后
   time curl https://your-app.back4app.io/health
   ```

3. **夜间闲置测试**
   ```bash
   # 晚上停止访问，第二天早上测试
   time curl https://your-app.back4app.io/health
   ```

**结果判断**：
- **< 2 秒响应**：不休眠，无需保活 ✅
- **> 10 秒响应**：会休眠，需要配置保活 ⚠️

---

### Hugging Face 稳定性测试

1. **连续运行测试**（24-48 小时）
   - 每小时访问 1 次
   - 记录响应时间
   - 记录任何错误或中断

2. **资源监控**
   - 查看 Space Logs
   - 观察是否有资源限制警告
   - 记录任何异常重启

3. **服务条款确认**
   - 阅读 Hugging Face 服务条款
   - 确认 API 服务是否符合条款
   - 如有疑问，咨询官方支持

**结果判断**：
- **稳定运行 48 小时**：可以使用 ✅
- **频繁重启或限制**：不推荐使用 ⚠️
- **收到警告或限制**：立即迁移 ❌

---

## 📚 部署文档

### 完整部署指南

1. **Back4app + Upstash**：[BACK4APP_DEPLOYMENT.md](./BACK4APP_DEPLOYMENT.md)
   - 不需要信用卡
   - GitHub 集成部署
   - 包含完整的保活测试指南

2. **Hugging Face + Upstash**：[HUGGINGFACE_DEPLOYMENT.md](./HUGGINGFACE_DEPLOYMENT.md)
   - 不需要信用卡
   - Docker SDK 部署
   - 包含服务条款注意事项

3. **Render + Upstash**：[RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md)
   - 需要绑定信用卡
   - Docker 镜像自动部署
   - 包含详细的保活配置

---

## ❓ 常见问题

### Q1: 哪个方案最推荐？

**A**: 取决于你的需求：

- **不想绑卡 + 小规模使用**：Back4app + Upstash ⭐⭐⭐⭐
- **不想绑卡 + 仅测试**：Hugging Face + Upstash ⭐⭐⭐
- **可以绑卡 + 需要稳定**：Render + Upstash ⭐⭐⭐⭐⭐
- **生产环境**：Render Starter ($7/月) + Upstash ⭐⭐⭐⭐⭐

---

### Q2: 256MB RAM 够用吗？

**A**: 取决于使用规模：

- ✅ **够用**：1-3 人，轻度到中度使用
- ⚠️ **可能不够**：5+ 人同时使用，大量并发请求
- ❌ **不够**：10+ 人，高并发，大量流式响应

**建议**：
- 先在 Back4app 测试 1-2 周
- 观察资源使用情况
- 如果不够，升级到 Shared Plan ($5/月，512MB RAM)
- 或迁移到 Render

---

### Q3: Back4app 会休眠吗？

**A**: **不确定**，官方文档未明确说明。

**必须测试**：
- 按照[测试清单](#back4app-测试重要)进行完整测试
- 如果会休眠，配置 Better Stack 保活
- 如果不会休眠，恭喜你找到了最佳免费方案

---

### Q4: Hugging Face 可以长期使用吗？

**A**: **不建议**，原因：

- ⚠️ 主要用于 ML 应用，API 服务是非典型用途
- ⚠️ 可能违反服务条款
- ⚠️ 资源不保证，稳定性未知
- ⚠️ 平台可能随时调整政策

**建议**：
- 仅用于短期测试（1-2周）
- 作为临时备用方案
- 不要用于生产或商业用途
- 长期使用请选择 Back4app 或 Render

---

### Q5: 为什么 Render 需要绑卡但还推荐？

**A**: 因为 Render 最成熟稳定：

- ✅ 512MB RAM（最充足）
- ✅ 专业 PaaS 平台
- ✅ 文档完善，社区成熟
- ✅ 保活方案清晰
- ✅ 升级选项灵活

**关于绑卡的说明**：
- 免费计划不会自动扣费
- 只有超出免费配额才会收费
- 750 小时/月足够全月运行
- 可以设置费用告警

---

### Q6: Upstash 免费 500K 命令/月够用吗？

**A**: **非常充足**

**计算**（3 人团队，中度使用）：
```
每人每天请求: 100 次
3 人 × 100 次 × 30 天 = 9,000 次/月
每次请求平均 10 个 Redis 命令 = 90,000 命令/月

结论：仅占免费配额的 18%
```

**计算**（10 人团队，重度使用）：
```
每人每天请求: 200 次
10 人 × 200 次 × 30 天 = 60,000 次/月
每次请求平均 10 个 Redis 命令 = 600,000 命令/月

结论：刚好超出免费配额，需升级
```

**Upstash 付费价格**：
- $0.2 / 100K 命令
- 超出 500K 后，每 100K 命令仅 $0.2
- 非常实惠

---

### Q7: 可以同时部署到多个平台吗？

**A**: **可以，推荐**

**推荐策略**：
1. 同时部署到 Back4app 和 Hugging Face
2. 使用同一个 Upstash Redis 实例
3. 测试 1-2 周，对比：
   - 稳定性
   - 响应速度
   - 资源使用
   - 是否休眠
4. 选择表现更好的平台作为主力
5. 保留另一个作为备用

**成本**：
- 所有平台都免费
- 共用一个 Redis，不增加成本
- 总成本：$0/月

---

## 🎯 最终推荐

### 不需要绑卡的最佳方案

```
主力平台：Back4app Containers
Redis：Upstash Redis Free
保活：Better Stack（如需要）
备用：Hugging Face Spaces（仅作备份）

总成本：$0/月
```

**部署顺序**：
1. 先部署到 Back4app（参考 [BACK4APP_DEPLOYMENT.md](./BACK4APP_DEPLOYMENT.md)）
2. 完成保活测试
3. 如果稳定，使用 Back4app 作为主力
4. 如果不稳定，考虑 Hugging Face 或咬牙绑卡用 Render

---

### 需要稳定性的最佳方案

```
平台：Render Free Plan（或 Starter $7/月）
Redis：Upstash Redis Free
保活：Better Stack

总成本：$0/月（Free）或 $7/月（Starter）
```

**推荐理由**：
- 最成熟的免费 PaaS 平台
- 512MB RAM 更充足
- 配合保活服务，体验接近付费
- 社区成熟，问题容易解决

---

## 🔍 深度研究：其他平台调查结果

经过全面研究，以下是其他平台的调查结果：

### ❌ 不符合要求的平台

| 平台 | 不符合原因 |
|------|-----------|
| **Northflank** | ⚠️ 需要信用卡验证（虽然免费，但注册时必须提供卡信息） |
| **Railway** | ⚠️ 自定义域名需要付费计划 |
| **Cyclic** | ❌ 已于 2024年5月关闭 |
| **Deta Space** | ❌ 已关闭 |
| **Fly.io** | ⚠️ 需要绑定信用卡 |
| **Vercel** | ❌ 不支持 Docker（仅 Serverless） |
| **Cloudflare Workers** | ❌ 不支持原生 Redis，需要代码改造 |
| **Okteto** | ❌ 已废弃免费个人套餐 |
| **FL0** | ⚠️ 平台功能不明确 |
| **Porter.run** | ⚠️ 免费套餐信息不明确 |
| **Zeabur** | ⚠️ Pay-as-you-go 模式，免费套餐不明确 |
| **CodeSandbox** | ❌ 开发环境为主，不适合生产部署 |
| **Replit** | ❌ 免费套餐限制过多 |
| **Adaptable.io** | ❌ 将于 2025年2月15日暂停所有应用 |
| **Scalingo** | ⚠️ 仅 30 天试用，无永久免费套餐 |
| **PikaPods** | ⚠️ 提供 $5 初始信用，但非永久免费 |
| **DigitalOcean App Platform** | ❌ 免费套餐仅限静态站点，Docker 需付费 |
| **Clever Cloud** | ⚠️ 提供免费信用，但无永久免费套餐 |
| **Oracle Cloud** | ⚠️ 慷慨的 Always Free 套餐，但需要信用卡验证 |

### ✅ 符合要求的平台总结

**完全符合要求（免费 + 不需要绑卡 + 永久域名 + Docker支持）**：
1. ✅ **Hugging Face Spaces**（但有服务条款限制）
2. ⚠️ **Northflank**（功能最强，但需要信用卡验证）

**需要信用卡但功能强大**：
3. ⭐ **Render**（最成熟，推荐）
4. ⭐ **Oracle Cloud Always Free**（资源最多，但需验证）

### 🎯 最终结论

经过深度研究，**真正不需要信用卡且提供永久域名的平台极其有限**：

1. **Hugging Face Spaces**：唯一完全符合所有要求的平台
   - ✅ 完全免费，无需信用卡
   - ✅ 永久的 `.hf.space` 域名
   - ✅ 完整 Docker 支持
   - ⚠️ 但主要面向 ML 应用，API 中转可能违反服务条款

2. **Northflank**：功能最强但需要卡验证
   - ⚠️ 注册需要信用卡验证（但不会扣费）
   - ✅ 支持自定义域名
   - ✅ 不会休眠
   - ✅ 免费套餐包含 2 个服务

3. **推荐方案组合**：
   - **测试/个人项目**：Hugging Face Spaces + Upstash
   - **需要稳定性**：咬牙绑卡使用 Render + Upstash
   - **资源需求大**：考虑 Oracle Cloud（需验证但资源多）

---

## 📞 获取帮助

如果在选择或部署过程中遇到问题：

1. **查看对应的部署文档**：
   - [BACK4APP_DEPLOYMENT.md](./BACK4APP_DEPLOYMENT.md)
   - [HUGGINGFACE_DEPLOYMENT.md](./HUGGINGFACE_DEPLOYMENT.md)
   - [RENDER_UPSTASH_DEPLOYMENT.md](./RENDER_UPSTASH_DEPLOYMENT.md)

2. **提交 Issue**：
   - https://github.com/Wei-Shaw/claude-relay-service/issues

3. **平台官方支持**：
   - Back4app: https://www.back4app.com/docs-containers
   - Hugging Face: https://discuss.huggingface.co/
   - Render: https://render.com/docs
   - Upstash: https://docs.upstash.com/
   - Northflank: https://northflank.com/docs

---

**祝你部署成功！🎉**
