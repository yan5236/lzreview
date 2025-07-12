# LzReview - 静态网站评论系统

<div align="center">
  <img src="https://raw.githubusercontent.com/yan5236/lzreview/main/logo.jpeg" width="200" style="border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
</div>


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

## 🚀 部署教程/文档

[一键部署教程](https://lzreviewdocs.nanhaiblog.top/quick-deployment-yijian.html)

[文档](https://lzreviewdocs.nanhaiblog.top/)

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
