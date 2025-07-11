# 通知推送功能配置指南

## 功能概述

lzreview 评论系统现已支持通知推送功能，当有新评论发布时可以自动发送通知。目前支持邮箱推送（通过 Resend API），未来可扩展其他推送方式。

## 环境变量配置

### 邮箱推送配置 (使用 Resend)

要启用邮箱推送功能，需要在 Cloudflare Workers 环境变量中配置以下项：

```bash
# Resend API 配置
RESEND_API_KEY=re_your_api_key_here         # 必需：Resend API密钥

# 可选配置
NOTIFICATION_FROM_NAME=lzreview评论系统      # 发件人名称
NOTIFICATION_FROM_EMAIL=notifications@yourdomain.com # 发件人邮箱（需要在Resend中验证的域名）
```

### 获取 Resend API Key

1. 访问 [Resend.com](https://resend.com) 并注册账户
2. 在控制台中创建新的 API Key
3. 添加并验证你的域名（用于发送邮件）
4. 将 API Key 添加到 Cloudflare Workers 环境变量

### 域名配置

为了使用 Resend 发送邮件，你需要：

1. **验证域名**：在 Resend 控制台添加你的域名
2. **DNS 配置**：根据 Resend 提供的信息配置 DNS 记录
3. **发件人邮箱**：使用已验证域名的邮箱作为发件人

例如，如果你的域名是 `example.com`，可以使用：
- `notifications@example.com`
- `noreply@example.com`
- `comments@example.com`

### 为什么选择 Resend？

- **简单易用**：RESTful API，易于集成
- **可靠性高**：专业的邮件发送服务
- **Cloudflare 兼容**：完美适配 Workers 环境
- **成本低廉**：每月免费额度充足
- **无需 SMTP**：避免 Workers 的网络限制

## 功能特性

### 1. 自动通知
- 新评论发布时自动发送邮件通知
- 异步发送，不影响评论发布速度
- 支持管理员和订阅者通知

### 2. 邮件模板
- 精美的HTML邮件模板
- 包含评论内容、作者信息、页面链接
- 支持纯文本邮件格式
- 可配置是否显示评论内容

### 3. 订阅管理
- 用户可以订阅特定页面的评论通知
- 支持邮箱订阅和取消订阅
- 管理员可以管理所有订阅者

### 4. 推送器管理
- 模块化设计，易于扩展
- 支持多种推送方式
- 推送器状态检查和测试

## 使用方法

### 1. 数据库迁移

首先运行数据库迁移来创建必要的表：

```bash
wrangler d1 execute lzreview-db --file=src/database/schema.sql
```

### 2. 配置环境变量

在 Cloudflare Workers 中设置环境变量：

```bash
# 设置 Resend API Key（敏感信息）
wrangler secret put RESEND_API_KEY

# 可选配置
wrangler secret put NOTIFICATION_FROM_NAME
wrangler secret put NOTIFICATION_FROM_EMAIL
```

或在 `wrangler.toml` 中配置：

```toml
[env.production.vars]
NOTIFICATION_FROM_NAME = "lzreview评论系统"
NOTIFICATION_FROM_EMAIL = "notifications@yourdomain.com"

[env.production.secrets]
# 使用 wrangler secret put 命令设置敏感信息
# RESEND_API_KEY = "re_your_api_key_here"
```

### 3. 管理面板配置

访问 `/admin` 管理面板，进入通知设置：

1. **查看推送器状态** - 检查邮箱推送器是否配置正确
2. **配置通知设置** - 设置管理员邮箱、通知选项
3. **测试推送功能** - 发送测试邮件验证配置
4. **管理订阅者** - 查看和管理邮件订阅列表

## API接口

### 获取通知配置
```http
GET /api/notifications/config
Authorization: Bearer your-admin-token
```

### 更新通知配置
```http
POST /api/notifications/config
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "recipients": ["admin@example.com"],
    "subscribers": [],
    "includePageInfo": true,
    "includeCommentContent": true,
    "template": "default"
  }
}
```

### 测试推送器
```http
POST /api/notifications/test
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "type": "email",
  "config": {
    "testEmail": "test@example.com"
  }
}
```

### 添加邮件订阅
```http
POST /api/notifications/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "用户名",
  "pageUrl": "https://example.com/page"
}
```

### 取消邮件订阅
```http
DELETE /api/notifications/subscribe/user@example.com
```

## 扩展开发

### 添加新的推送器

1. 在 `src/notifiers/` 目录创建新的推送器文件
2. 实现推送器接口：
   ```javascript
   export class WebhookNotifier {
     constructor(config) { ... }
     async sendNewCommentNotification(commentData, config) { ... }
     async test(config) { ... }
   }
   ```
3. 在 `NotificationService` 中注册新推送器
4. 更新配置模板和验证逻辑

### 自定义邮件模板

可以在 `EmailNotifier` 中修改 `generateHTMLTemplate` 和 `generateTextTemplate` 方法来自定义邮件模板。

## 故障排查

### 1. 邮件发送失败
- 检查 SMTP 配置是否正确
- 确认邮箱服务商的安全设置
- 查看 Cloudflare Workers 日志

### 2. 推送器不可用
- 确认环境变量已正确设置
- 检查网络连接和防火墙设置
- 使用测试接口验证配置

### 3. 订阅功能异常
- 确认数据库表已正确创建
- 检查邮箱格式验证
- 查看数据库操作日志

## 安全注意事项

1. **敏感信息保护**
   - 使用 Cloudflare Workers Secrets 存储 Resend API Key
   - 不要在代码中硬编码敏感信息

2. **权限控制**
   - 通知配置需要管理员权限
   - 订阅操作应有适当的验证

3. **邮件安全**
   - 使用 HTTPS 保护邮件链接
   - 考虑添加邮件签名验证

## 性能优化

1. **异步处理**
   - 通知发送不阻塞评论发布
   - 使用队列处理大量通知

2. **批量发送**
   - 避免频繁的单独邮件发送
   - 考虑合并相近时间的通知

3. **缓存优化**
   - 缓存通知配置
   - 减少数据库查询次数