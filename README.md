# LzReview - 静态网站评论系统

一个基于 Cloudflare Workers 和 D1 数据库的轻量级静态网站评论系统。

## ✨ 特性

- 🚀 基于 Cloudflare Workers，全球边缘计算，响应快速
- 💾 使用 D1 数据库，数据持久化存储
- 🎨 响应式设计，支持桌面端和移动端
- 🔒 内置安全防护（XSS、CSRF、速率限制、白名单）
- 👤 支持 QQ 头像和自动生成头像
- 💬 支持回复功能
- 🔧 管理后台（白名单管理、评论管理）
- 📱 易于集成，只需几行代码
- 🛠 模块化架构，易于维护和扩展

## 🚀 快速开始

### 1. 部署准备

1. 确保你有 Cloudflare 账号
2. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

### 2. 配置项目

1. 克隆或下载项目到本地
2. 安装依赖：
   ```bash
   npm install
   ```

3. 创建 D1 数据库：
   ```bash
   wrangler d1 create lzreview-db
   ```

4. 复制配置文件：
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```
   
   更新 `wrangler.toml` 中的配置：
   - 将 `your-database-id-here` 替换为上一步创建的数据库ID
   - 生成强随机令牌替换 `your-admin-token-here`

5. 运行数据库迁移：
   ```bash
   npm run db:migrate
   ```

### 3. 部署到 Cloudflare Workers

```bash
npm run deploy
```

部署成功后，你会得到一个类似 `https://lzreview.your-subdomain.workers.dev` 的URL。

### 4. 在网站中集成评论

在你的网页中添加以下代码：

```html
<!-- 评论容器 -->
<div id="lzreview-comments"></div>

<!-- 引入评论系统 -->
<script>
window.lzreviewConfig = {
    apiUrl: 'https://your-worker-url.workers.dev',
    pageUrl: window.location.href,
    placeholder: '说点什么吧...'
};
</script>
<script src="https://your-worker-url.workers.dev/embed.js"></script>
```

## ⚙️ 配置选项

通过 `window.lzreviewConfig` 对象可以自定义评论系统：

```javascript
window.lzreviewConfig = {
    apiUrl: 'https://your-worker-url.workers.dev',  // 必填：Worker URL
    pageUrl: window.location.href,                  // 必填：当前页面URL
    placeholder: '说点什么吧...',                    // 可选：评论框占位符
    maxLength: 1000,                                 // 可选：评论最大长度
    requireName: true,                               // 可选：是否必须填写姓名
    requireEmail: false                              // 可选：是否必须填写邮箱
};
```

## 🛠 管理功能

### 删除评论

使用管理员令牌可以删除评论：

```bash
curl -X DELETE "https://your-worker-url.workers.dev/api/comments/123" \\
     -H "Authorization: Bearer your-admin-token"
```

### 设置管理员令牌

在 `wrangler.toml` 中设置：

```toml
[vars]
ADMIN_TOKEN = "your-secret-admin-token"
```

或在 Cloudflare Workers 控制台的环境变量中设置。

## 📊 API 接口

### 获取评论

```
GET /api/comments?page={pageUrl}&limit={limit}&offset={offset}
```

### 发布评论

```
POST /api/comments
Content-Type: application/json

{
  "pageUrl": "https://example.com/post1",
  "authorName": "用户名",
  "authorEmail": "user@example.com",
  "content": "评论内容"
}
```

### 删除评论（需要管理员权限）

```
DELETE /api/comments/{id}
Authorization: Bearer {admin-token}
```

## 🔧 开发

### 本地开发

```bash
npm run dev
```

这会启动本地开发服务器。

### 项目结构

```
lzreview/
├── src/
│   ├── index.js              # Worker 主文件
│   ├── handlers/             # 请求处理模块
│   │   └── comments.js       # 评论API处理
│   ├── database/             # 数据库模块
│   │   ├── schema.sql        # 数据库表结构
│   │   └── db.js             # 数据库操作封装
│   ├── utils/                # 工具函数
│   │   ├── validation.js     # 数据验证
│   │   ├── security.js       # 安全相关
│   │   └── response.js       # 响应格式化
│   └── web/                  # 前端资源
│       ├── embed.js          # 嵌入式评论组件
│       └── embed.css         # 样式文件
├── wrangler.toml             # Cloudflare Workers配置
├── package.json              # 项目依赖
└── README.md                 # 本文件
```

## 🔒 安全特性

- **速率限制**：防止刷新攻击
- **内容过滤**：检测并阻止不当内容
- **输入净化**：防止XSS攻击
- **CORS支持**：安全的跨域请求
- **管理员权限**：删除功能需要令牌验证

## 🌐 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果你在使用过程中遇到问题，可以：

1. 查看 Cloudflare Workers 控制台的日志
2. 检查浏览器开发者工具的控制台错误  
3. 确认数据库连接和配置正确

## 🛡️ 安全特性

- **XSS 防护**：所有用户输入都经过严格过滤和转义
- **CSRF 防护**：使用令牌验证防止跨站请求伪造
- **速率限制**：防止垃圾评论和暴力攻击
- **白名单机制**：只允许授权域名使用评论功能
- **内容过滤**：自动检测和过滤不当内容
- **IP 隐私保护**：存储哈希值而非明文 IP 地址

## 🔧 管理后台

访问 `https://your-worker.your-subdomain.workers.dev/admin` 进入管理后台，可以：

- 管理白名单域名
- 查看和删除评论
- 查看系统统计信息

## 🎯 路线图

- [x] 回复功能
- [x] 安全防护（XSS、CSRF、速率限制）
- [x] 白名单管理
- [x] QQ头像支持
- [ ] 邮件通知
- [ ] 更多主题样式
- [ ] 统计分析面板
- [ ] 评论审核功能
