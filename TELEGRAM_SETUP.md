# Telegram 机器人推送配置指南

## 概述
lzreview 支持通过 Telegram 机器人发送评论通知。当有新评论或回复时，系统会自动向配置的 Telegram 聊天发送通知消息。

## 第一步：创建 Telegram 机器人

### 1. 联系 BotFather
1. 在 Telegram 中搜索并打开 `@BotFather`
2. 发送 `/start` 命令开始对话
3. 发送 `/newbot` 命令创建新机器人

### 2. 配置机器人信息
1. 按提示输入机器人的显示名称（例如：`lzreview通知机器人`）
2. 输入机器人的用户名（必须以 `bot` 结尾，例如：`lzreview_notify_bot`）
3. BotFather 会返回机器人的 Token，格式类似：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 3. 配置机器人设置（可选）
```
/setdescription - 设置机器人描述
/setabouttext - 设置关于文本
/setuserpic - 设置机器人头像
```

## 第二步：获取 Chat ID

### 方法一：私聊机器人（个人通知）
1. 搜索你刚创建的机器人用户名
2. 点击 "开始" 或发送 `/start`
3. 发送任意消息给机器人
4. 在浏览器中访问：`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. 在返回的 JSON 中找到 `"chat":{"id":123456789}` 中的数字，这就是你的 Chat ID

### 方法二：群组通知
1. 创建一个 Telegram 群组
2. 将你的机器人添加到群组中
3. 给机器人管理员权限（推荐）
4. 在群组中发送任意消息
5. 访问：`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. 找到群组的 Chat ID（通常是负数，如：`-123456789`）

### 方法三：频道通知
1. 创建一个 Telegram 频道
2. 将机器人添加为频道管理员
3. 在频道中发送任意消息
4. 访问 getUpdates API 获取频道 Chat ID

## 第三步：配置环境变量

在你的 Cloudflare Workers 环境变量中添加以下配置：

### 必需配置
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 可选配置
```
TELEGRAM_PARSE_MODE=HTML  # 消息解析模式，可选值：HTML, Markdown
```

## 第四步：配置通知设置

在评论系统管理后台的通知配置中添加 Telegram 设置：

```json
{
  "telegram": {
    "enabled": true,
    "chatIds": [
      "123456789",           // 个人 Chat ID
      "-987654321",          // 群组 Chat ID
      "@your_channel"        // 频道用户名（如果是公开频道）
    ],
    "includePageInfo": true,      // 是否包含页面信息
    "includeCommentContent": true  // 是否包含评论内容
  }
}
```

## 第五步：测试配置

### 使用管理后台测试
1. 进入管理后台的通知设置页面
2. 点击 "测试 Telegram 推送" 按钮
3. 检查是否收到测试消息

### 手动测试 API
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "🧪 这是一条测试消息",
    "parse_mode": "HTML"
  }'
```

## 配置示例

### 个人通知配置
```json
{
  "telegram": {
    "enabled": true,
    "chatIds": ["123456789"],
    "includePageInfo": true,
    "includeCommentContent": true
  }
}
```

### 多人群组通知配置
```json
{
  "telegram": {
    "enabled": true,
    "chatIds": [
      "123456789",      // 管理员个人
      "-987654321",     // 团队群组
      "-555666777"      // 备份群组
    ],
    "includePageInfo": true,
    "includeCommentContent": false  // 出于隐私考虑，群组中不显示评论内容
  }
}
```

### 频道通知配置
```json
{
  "telegram": {
    "enabled": true,
    "chatIds": ["@your_public_channel"],
    "includePageInfo": true,
    "includeCommentContent": true
  }
}
```

## 常见问题

### Q: 机器人发送消息失败
**A: 检查以下几点：**
- Bot Token 是否正确配置
- Chat ID 是否正确
- 机器人是否被用户/群组屏蔽
- 群组中机器人是否有发送消息权限

### Q: 无法获取 Chat ID
**A: 尝试以下方法：**
1. 确保向机器人发送了消息
2. 检查 getUpdates API 返回结果
3. 使用第三方 Chat ID 获取机器人（搜索 @userinfobot）

### Q: 群组中机器人无法发送消息
**A: 检查机器人权限：**
1. 机器人是否是群组成员
2. 群组设置是否允许机器人发送消息
3. 给机器人管理员权限

### Q: 消息格式显示异常
**A: 检查解析模式：**
- HTML 模式：支持 `<b>`, `<i>`, `<a>` 等标签
- Markdown 模式：支持 `*bold*`, `_italic_` 等语法
- 确保特殊字符正确转义

## 安全注意事项

1. **保护 Bot Token**：不要在代码中硬编码 Token，使用环境变量
2. **限制机器人权限**：只给机器人必要的权限
3. **Chat ID 隐私**：避免在日志中输出完整的 Chat ID
4. **消息内容**：考虑是否在群组/频道中显示敏感的评论内容

## 高级配置

### 自定义消息模板
可以通过修改 `TelegramNotifier` 类的 `generateMessageContent` 方法来自定义消息格式。

### 添加按钮交互
可以使用 Telegram Inline Keyboard 添加快速操作按钮：
```javascript
// 在 sendMessage 方法中添加
const messageData = {
  chat_id: chatId,
  text: message,
  parse_mode: this.config.parseMode,
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [[
      { text: "查看评论", url: commentUrl },
      { text: "访问页面", url: pageUrl }
    ]]
  }
};
```

### 消息优先级
为不同类型的通知设置不同的优先级和格式：
- 🔔 普通评论
- 💬 回复通知
- ⚠️ 敏感内容警告
- 🚨 垃圾邮件检测

## 监控和调试

### 启用详细日志
在环境变量中设置：
```
TELEGRAM_DEBUG=true
```

### 监控发送状态
系统会记录每次推送的结果，可以在管理后台查看推送统计。

### API 限制
Telegram Bot API 有以下限制：
- 每秒最多 30 条消息
- 每分钟对同一群组最多 20 条消息
- 消息最大长度 4096 字符

如需发送大量通知，建议实现队列机制。