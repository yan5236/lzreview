# 🚀 lzreview 部署指南

## 前置要求

1. **Node.js** (版本 16 或更高)
2. **Cloudflare 账号**（免费）

## 第1步：安装依赖

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 安装项目依赖
npm install
```

## 第2步：登录 Cloudflare

```bash
wrangler auth login
```

会打开浏览器，登录你的 Cloudflare 账号并授权。

## 第3步：创建 D1 数据库

```bash
wrangler d1 create lzreview-db
```

命令执行后会返回类似这样的信息：
```
✅ Successfully created DB 'lzreview-db'!

[[d1_databases]]
binding = "DB"
database_name = "lzreview-db"
database_id = "1d54a0e2-0fa3-45e7-892d-b8adead3635c"  # 你的数据库ID
```

## 第4步：更新配置文件

将第3步得到的 `database_id` 复制到 `wrangler.toml` 文件中：

```toml
name = "lzreview"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "lzreview-db"
database_id = "1d54a0e2-0fa3-45e7-892d-b8adead3635c"  # 替换为你的数据库ID

[vars]
ADMIN_TOKEN = "your-admin-token-here"  # 可以改成你自己的管理员密码
SITE_URL = "your-site-url.com"        # 可选
```

## 第5步：初始化数据库

```bash
wrangler d1 execute lzreview-db --file=src/database/schema.sql
```

应该看到类似这样的输出：
```
🌀 Mapping SQL input into an array of statements
🌀 Parsing 4 statements
🌀 Executing on lzreview-db (1d54a0e2-0fa3-45e7-892d-b8adead3635c):
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
✅ Executed 4 commands in 0.123ms
```

## 第6步：本地测试（可选）

```bash
npm run dev
```

打开 http://localhost:8787 测试功能。

## 第7步：部署到 Cloudflare Workers

```bash
npm run deploy
```

部署成功后会得到一个 URL，类似：
```
✨ Your worker has been published!
🌎 https://lzreview.your-subdomain.workers.dev
```

## 第8步：测试部署

1. 访问部署的 URL
2. 点击"评论测试"标签页
3. 点击"测试数据库连接"按钮
4. 试试发布一条评论

## 常见问题

### 1. 数据库连接失败
- 确认已经运行了第5步的数据库初始化
- 检查 `wrangler.toml` 中的 `database_id` 是否正确

### 2. 评论发布失败（400错误）
- 很可能是数据库表没有创建，重新运行第5步
- 检查浏览器控制台的错误信息

### 3. 权限错误
- 确认已经用 `wrangler auth login` 登录
- 确认你有 Cloudflare Workers 的使用权限

## 在网站中集成

部署成功后，在你的网站中添加：

```html
<!-- 评论容器 -->
<div id="lzreview-comments"></div>

<!-- 引入评论系统 -->
<script>
window.lzreviewConfig = {
    apiUrl: 'https://lzreview.your-subdomain.workers.dev',  // 替换为你的Worker URL
    pageUrl: window.location.href,
    placeholder: '说点什么吧...'
};
</script>
<script src="https://lzreview.your-subdomain.workers.dev/embed.js"></script>
```

## 管理功能

删除评论（需要管理员权限）：

```bash
curl -X DELETE "https://lzreview.your-subdomain.workers.dev/api/comments/1" \
     -H "Authorization: Bearer your-admin-token-here"
```

## 🎉 完成！

现在你的评论系统就部署成功了！可以在任何静态网站中使用。