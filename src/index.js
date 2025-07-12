import { DatabaseService } from './database/db.js';
import { handleComments } from './handlers/comments.js';
import { handleWhitelist } from './handlers/whitelist.js';
import { handleNotifications } from './handlers/notifications.js';
import { corsResponse, htmlResponse, jsonResponse } from './utils/response.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const db = new DatabaseService(env.DB);
    db.setAdminToken(env.ADMIN_TOKEN);

    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    // 路由处理
    if (url.pathname.startsWith('/api/comments')) {
      return handleComments(request, db, env, ctx);
    }

    // 白名单管理
    if (url.pathname.startsWith('/api/whitelist')) {
      return handleWhitelist(request, db, env);
    }

    // 通知推送管理
    if (url.pathname.startsWith('/api/notifications')) {
      return handleNotifications(request, db, env);
    }

    // 管理面板
    if (url.pathname === '/admin') {
      return serveAdminPanel(env);
    }

    // 测试路由 - 检查数据库连接
    if (url.pathname === '/api/test') {
      try {
        const testQuery = await db.db.prepare('SELECT 1 as test').first();
        return jsonResponse({ status: 'ok', database: 'connected', test: testQuery });
      } catch (error) {
        return jsonResponse({ status: 'error', message: error.message }, 500);
      }
    }

    // 提供嵌入式JS文件
    if (url.pathname === '/embed.js') {
      return serveEmbedScript(request, env);
    }

    // 提供CSS文件
    if (url.pathname === '/embed.css') {
      return serveEmbedCSS();
    }

    // 默认首页 - 显示部署成功信息
    return serveHomePage(env);
  }
};

async function serveHomePage(env) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>lzreview 评论系统</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid #c3e6cb;
        }
        .test-section {
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border-radius: 8px;
            margin: 2rem 0;
            border: 1px solid #ffeaa7;
        }
        .code {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 2rem; }
        .footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
        }
        .nav-tabs {
            border-bottom: 2px solid #dee2e6;
            margin-bottom: 2rem;
        }
        .nav-tab {
            display: inline-block;
            padding: 0.5rem 1rem;
            margin-right: 1rem;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            text-decoration: none;
            color: #495057;
        }
        .nav-tab.active {
            background: #fff;
            color: #007bff;
            border-bottom: 2px solid #fff;
            margin-bottom: -2px;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="success">
        <h2>🎉 恭喜你，lzreview 评论系统已部署成功！</h2>
        <p>你现在可以使用下面的方式为你的静态网站添加评论功能。</p>
    </div>

    <h1>lzreview 评论系统</h1>
    
    <div class="nav-tabs">
        <a href="#" class="nav-tab active" onclick="showTab('test')">📝 评论测试</a>
        <a href="#" class="nav-tab" onclick="showTab('guide')">📖 使用指南</a>
        <a href="#" class="nav-tab" onclick="showTab('api')">🔧 API文档</a>
    </div>

    <div id="test-content" class="tab-content active">
        <div class="test-section">
            <h2>🧪 评论功能测试</h2>
            <p>在这里你可以直接测试评论系统的功能，试试发布一条评论吧！</p>
            <button onclick="testDatabase()" style="margin-bottom: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔧 测试数据库连接
            </button>
            <div id="test-result" style="margin-bottom: 1rem;"></div>
        </div>
        
        <!-- 评论测试容器 -->
        <div id="lzreview-comments"></div>
    </div>

    <div id="guide-content" class="tab-content">
        <h2>🚀 快速集成</h2>
        <p>在你的网页中添加以下代码即可启用评论功能：</p>

        <div class="code">
&lt;!-- 评论容器 --&gt;
&lt;div id="lzreview-comments"&gt;&lt;/div&gt;

&lt;!-- 引入评论系统 --&gt;
&lt;script&gt;
window.lzreviewConfig = {
    apiUrl: '${env.SITE_URL || 'your-worker-url.workers.dev'}',
    pageUrl: window.location.href,
    placeholder: '说点什么吧...'
};
&lt;/script&gt;
&lt;script src="${env.SITE_URL || 'your-worker-url.workers.dev'}/embed.js"&gt;&lt;/script&gt;
        </div>

        <h2>⚙️ 配置选项</h2>
        <p>你可以通过 <code>window.lzreviewConfig</code> 对象自定义评论系统：</p>
        
        <div class="code">
window.lzreviewConfig = {
    apiUrl: '你的Worker域名',           // 必填：API地址
    pageUrl: window.location.href,     // 必填：当前页面URL
    placeholder: '说点什么吧...',      // 可选：评论框占位符
    maxLength: 1000,                   // 可选：评论最大长度
    requireName: true,                 // 可选：是否必须填写姓名
    requireEmail: false                // 可选：是否必须填写邮箱
};
        </div>
    </div>

    <div id="api-content" class="tab-content">
        <h2>🛠 管理功能</h2>
        <p>使用管理员令牌可以删除评论：</p>
        <div class="code">
DELETE /api/comments/{id}
Authorization: Bearer your-admin-token
        </div>

        <h2>📊 系统信息</h2>
        <ul>
            <li><strong>版本：</strong>1.0.0</li>
            <li><strong>数据库：</strong>Cloudflare D1</li>
            <li><strong>运行时：</strong>Cloudflare Workers</li>
            <li><strong>部署状态：</strong><span style="color: #28a745;">✅ 正常运行</span></li>
        </ul>
    </div>

    <div class="footer">
        <p>🔧 Powered by <strong>lzreview</strong> - 轻量级静态网站评论系统</p>
    </div>

    <script>
        // 标签页切换功能
        function showTab(tabName) {
            // 隐藏所有标签页内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 移除所有标签页激活状态
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 显示选中的标签页内容
            document.getElementById(tabName + '-content').classList.add('active');
            
            // 激活选中的标签页
            event.target.classList.add('active');
        }

        // 测试数据库连接
        async function testDatabase() {
            const resultDiv = document.getElementById('test-result');
            resultDiv.innerHTML = '<p style="color: #666;">正在测试数据库连接...</p>';
            
            try {
                const response = await fetch('/api/test');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    resultDiv.innerHTML = '<p style="color: #28a745;">✅ 数据库连接成功！</p>';
                } else {
                    resultDiv.innerHTML = \`<p style="color: #dc3545;">❌ 数据库连接失败：\${data.message}</p>\`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<p style="color: #dc3545;">❌ 测试失败：\${error.message}</p>\`;
            }
        }

        // 初始化评论系统（仅在测试标签页）
        window.lzreviewConfig = {
            apiUrl: window.location.origin,
            pageUrl: window.location.origin + '/#test',
            placeholder: '在这里测试评论功能，试试发布一条评论吧！',
            maxLength: 1000,
            requireName: true,
            requireEmail: false
        };
    </script>
    
    <!-- 加载评论系统 -->
    <script src="/embed.js"></script>
</body>
</html>`;

  return htmlResponse(html);
}

async function serveEmbedScript(request, env) {
  const embedScript = await import('./web/embed.js');
  const script = embedScript.default.replace('{{API_URL}}', env.SITE_URL || new URL(request.url).origin);
  
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

async function serveEmbedCSS() {
  const embedCSS = await import('./web/embed.css');
  
  return new Response(embedCSS.default, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

async function serveAdminPanel(env) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>lzreview 管理面板</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .login-section {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            margin: 50px auto;
        }
        .admin-section {
            display: none;
        }
        .tabs {
            display: flex;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }
        .tab {
            flex: 1;
            padding: 15px 20px;
            background: #f8f9fa;
            border: none;
            cursor: pointer;
            border-right: 1px solid #dee2e6;
            font-size: 14px;
            font-weight: 500;
        }
        .tab:last-child { border-right: none; }
        .tab.active {
            background: #007cba;
            color: white;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        .form-input, .form-select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        .btn {
            background: #007cba;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin-right: 10px;
        }
        .btn:hover { background: #005a87; }
        .btn-danger {
            background: #dc3545;
            padding: 8px 16px;
            font-size: 12px;
        }
        .btn-danger:hover { background: #c82333; }
        .btn-success {
            background: #28a745;
        }
        .btn-success:hover { background: #218838; }
        .alert {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .card {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007cba;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .page-list {
            display: grid;
            gap: 20px;
        }
        .page-item {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #007cba;
        }
        .page-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        .page-url {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
            word-break: break-all;
        }
        .page-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }
        .page-stat {
            color: #666;
            font-size: 14px;
        }
        .page-actions {
            display: flex;
            gap: 10px;
        }
        .comments-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .comments-table th,
        .comments-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .comments-table th {
            background: #f8f9fa;
            font-weight: 500;
        }
        .comment-content {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .batch-actions {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .whitelist-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
        }
        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 500px;
        }
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover { color: black; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>🛠 lzreview 管理面板</h1>
                <p>管理您的评论系统</p>
            </div>
            <button id="logout-btn" class="btn btn-danger" style="display: none;">退出登录</button>
        </div>

        <div id="login-section" class="login-section">
            <h2>请输入管理员密钥</h2>
            <div id="login-message"></div>
            <form id="login-form">
                <div class="form-group">
                    <label class="form-label" for="admin-token">管理员密钥</label>
                    <input type="password" id="admin-token" class="form-input" placeholder="请输入管理员密钥" required>
                </div>
                <button type="submit" class="btn">登录</button>
            </form>
        </div>

        <div id="admin-section" class="admin-section">
            <div class="stats" id="stats-section">
                <div class="stat-card">
                    <div class="stat-number" id="total-comments">-</div>
                    <div class="stat-label">总评论数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="today-comments">-</div>
                    <div class="stat-label">今日评论</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="total-pages">-</div>
                    <div class="stat-label">页面数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="whitelist-count">-</div>
                    <div class="stat-label">白名单数量</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('pages')">页面管理</button>
                <button class="tab" onclick="showTab('comments')">评论管理</button>
                <button class="tab" onclick="showTab('whitelist')">白名单管理</button>
                <button class="tab" onclick="showTab('notifications')">通知推送</button>
            </div>

            <div id="pages-content" class="tab-content active">
                <div class="card">
                    <h3>页面管理</h3>
                    <div id="admin-message"></div>
                    <div id="pages-loading" class="loading">正在加载页面...</div>
                    <div id="pages-list" class="page-list"></div>
                </div>
            </div>

            <div id="comments-content" class="tab-content">
                <div class="card">
                    <h3>评论管理</h3>
                    <div class="batch-actions">
                        <input type="checkbox" id="select-all" onchange="toggleSelectAll()">
                        <label for="select-all">全选</label>
                        <button class="btn btn-danger" onclick="batchDelete()">批量删除</button>
                        <select id="page-filter" class="form-select" onchange="filterComments()" style="width: 300px; display: inline-block;">
                            <option value="">所有页面</option>
                        </select>
                    </div>
                    <div id="comments-loading" class="loading">正在加载评论...</div>
                    <table id="comments-table" class="comments-table" style="display: none;">
                        <thead>
                            <tr>
                                <th width="50">选择</th>
                                <th>ID</th>
                                <th>页面</th>
                                <th>作者</th>
                                <th>内容</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="comments-tbody">
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="whitelist-content" class="tab-content">
                <div class="card">
                    <h3>白名单管理</h3>
                    <div class="form-group">
                        <button class="btn btn-success" onclick="showAddWhitelistModal()">添加域名</button>
                    </div>
                    <div id="whitelist-loading" class="loading">正在加载白名单...</div>
                    <div id="whitelist-list"></div>
                </div>
            </div>

            <div id="notifications-content" class="tab-content">
                <div class="card">
                    <h3>通知推送配置</h3>
                    <div id="notification-status" class="alert" style="display: none;"></div>
                    
                    <!-- 推送器状态 -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>推送器状态</h4>
                        <div id="notifiers-status">
                            <div class="loading">正在检查推送器状态...</div>
                        </div>
                    </div>

                    <!-- 邮箱推送配置 -->
                    <div class="card">
                        <h4>邮箱推送配置</h4>
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #007cba;">
                            <h5 style="margin: 0 0 10px 0; color: #007cba;">📧 邮箱推送功能说明</h5>
                            <p style="margin: 0; color: #333; line-height: 1.5;">
                                <strong>管理员邮箱</strong>：当网站有新评论时，系统会自动发送邮件通知到这些邮箱，让你及时了解评论动态。<br>
                                <strong>用途</strong>：适合网站管理员、博主等需要及时响应评论的人员。<br>
                                <strong>格式</strong>：支持多个邮箱，用逗号分隔，如：admin@example.com, blogger@example.com
                            </p>
                        </div>
                        
                        <form id="email-notification-form">
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="email-enabled"> 启用邮箱推送
                                </label>
                                <small style="color: #666; display: block; margin-top: 5px;">
                                    勾选后，每当有新评论发布时，系统会自动发送邮件通知
                                </small>
                            </div>
                            
                            <div id="email-config" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label" for="admin-emails">
                                        📮 管理员邮箱地址 
                                        <span style="color: #dc3545;">*</span>
                                    </label>
                                    <input type="text" id="admin-emails" class="form-input" 
                                           placeholder="your-email@qq.com, admin@gmail.com" 
                                           style="margin-bottom: 5px;">
                                    <small style="color: #666; line-height: 1.4;">
                                        💡 <strong>作用</strong>：当有新评论时，这些邮箱会收到通知邮件<br>
                                        💡 <strong>格式</strong>：多个邮箱用逗号分隔<br>
                                        💡 <strong>建议</strong>：填写你经常查看的邮箱，如QQ邮箱、Gmail等
                                    </small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="include-page-info" checked> 在邮件中包含页面信息
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="include-comment-content" checked> 在邮件中包含评论内容
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn">保存配置</button>
                                <button type="button" class="btn btn-secondary" onclick="testEmailNotification()">测试邮件发送</button>
                            </div>
                        </form>
                    </div>

                    <!-- Telegram推送配置 -->
                    <div class="card">
                        <h4>Telegram推送配置</h4>
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                            <h5 style="margin: 0 0 10px 0; color: #28a745;">📱 Telegram推送功能说明</h5>
                            <p style="margin: 0; color: #333; line-height: 1.5;">
                                <strong>Chat ID</strong>：当网站有新评论时，系统会自动发送消息到指定的Telegram聊天，让你及时了解评论动态。<br>
                                <strong>用途</strong>：适合希望通过Telegram即时接收通知的用户，支持个人、群组和频道。<br>
                                <strong>配置</strong>：需要先创建Telegram机器人并获取Chat ID，详见 <a href="/TELEGRAM_SETUP.md" target="_blank">配置指南</a>
                            </p>
                        </div>
                        
                        <form id="telegram-notification-form">
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="telegram-enabled"> 启用Telegram推送
                                </label>
                                <small style="color: #666; display: block; margin-top: 5px;">
                                    勾选后，每当有新评论发布时，系统会自动发送Telegram消息通知
                                </small>
                            </div>
                            
                            <div id="telegram-config" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label" for="telegram-chat-ids">
                                        💬 接收通知的Chat ID 
                                        <span style="color: #dc3545;">*</span>
                                    </label>
                                    <input type="text" id="telegram-chat-ids" class="form-input" 
                                           placeholder="123456789, -987654321, @your_channel" 
                                           style="margin-bottom: 5px;">
                                    <small style="color: #666; line-height: 1.4;">
                                        💡 <strong>格式</strong>：多个Chat ID用逗号分隔<br>
                                        💡 <strong>个人聊天</strong>：正数，如 123456789<br>
                                        💡 <strong>群组聊天</strong>：负数，如 -987654321<br>
                                        💡 <strong>公开频道</strong>：@用户名，如 @your_channel<br>
                                        💡 <strong>获取方法</strong>：查看 <a href="/TELEGRAM_SETUP.md" target="_blank">配置指南</a>
                                    </small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="telegram-include-page-info" checked> 在消息中包含页面信息
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="telegram-include-comment-content" checked> 在消息中包含评论内容
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn">保存配置</button>
                                <button type="button" class="btn btn-secondary" onclick="testTelegramNotification()">测试Telegram推送</button>
                            </div>
                        </form>
                    </div>

                    <!-- 订阅者管理 -->
                    <div class="card">
                        <h4>邮件订阅者管理</h4>
                        <div id="subscribers-loading" class="loading" style="display: none;">正在加载订阅者...</div>
                        <div id="subscribers-list"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加白名单模态框 -->
        <div id="whitelist-modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h3>添加域名到白名单</h3>
                <form id="whitelist-form">
                    <div class="form-group">
                        <label class="form-label" for="domain">域名</label>
                        <input type="text" id="domain" class="form-input" placeholder="example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="description">描述</label>
                        <input type="text" id="description" class="form-input" placeholder="可选描述">
                    </div>
                    <button type="submit" class="btn">添加</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        let adminToken = '';
        let allComments = [];
        let currentPageUrl = '';
        const apiUrl = window.location.origin;

        // 登录处理
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('admin-token').value.trim();
            
            if (!token) {
                showLoginMessage('请输入管理员密钥', 'error');
                return;
            }

            adminToken = token;
            
            try {
                await loadStats();
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('admin-section').style.display = 'block';
                document.getElementById('logout-btn').style.display = 'block';
                await loadPages();
            } catch (error) {
                showLoginMessage('密钥验证失败', 'error');
                adminToken = '';
            }
        });

        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            adminToken = '';
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('admin-section').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'none';
            document.getElementById('admin-token').value = '';
        });

        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName + '-content').classList.add('active');
            
            if (tabName === 'comments') {
                loadComments();
            } else if (tabName === 'whitelist') {
                loadWhitelist();
            } else if (tabName === 'notifications') {
                loadNotificationSettings();
            }
        }

        function showLoginMessage(message, type) {
            const messageEl = document.getElementById('login-message');
            messageEl.innerHTML = \`<div class="alert alert-\${type}">\${message}</div>\`;
        }

        function showAdminMessage(message, type) {
            const messageEl = document.getElementById('admin-message');
            messageEl.innerHTML = \`<div class="alert alert-\${type}">\${message}</div>\`;
            setTimeout(() => messageEl.innerHTML = '', 3000);
        }

        async function loadStats() {
            try {
                const response = await fetch(\`\${apiUrl}/api/comments/stats\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });
                
                if (!response.ok) throw new Error('Unauthorized');
                
                const data = await response.json();
                document.getElementById('total-comments').textContent = data.data.total || 0;
                document.getElementById('today-comments').textContent = data.data.today || 0;
                document.getElementById('total-pages').textContent = data.data.pages || 0;
                document.getElementById('whitelist-count').textContent = data.data.whitelist || 0;
            } catch (error) {
                throw error;
            }
        }

        async function loadPages() {
            const loadingEl = document.getElementById('pages-loading');
            const listEl = document.getElementById('pages-list');
            
            loadingEl.style.display = 'block';
            listEl.innerHTML = '';

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/pages\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Unauthorized');

                const data = await response.json();
                const pages = data.data.pages;
                
                listEl.innerHTML = pages.map(page => \`
                    <div class="page-item">
                        <div class="page-title">\${page.title || '无标题'}</div>
                        <div class="page-url">\${page.page_url}</div>
                        <div class="page-stats">
                            <span class="page-stat">评论数: \${page.comment_count}</span>
                            <span class="page-stat">最新: \${formatDate(page.latest_comment)}</span>
                        </div>
                        <div class="page-actions">
                            <button class="btn" onclick="viewPageComments('\${page.page_url}')">查看评论</button>
                            <button class="btn btn-danger" onclick="deletePageComments('\${page.page_url}')">删除所有评论</button>
                        </div>
                    </div>
                \`).join('');

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('加载页面失败', 'error');
            }
        }

        async function loadComments() {
            const loadingEl = document.getElementById('comments-loading');
            const tableEl = document.getElementById('comments-table');
            
            loadingEl.style.display = 'block';
            tableEl.style.display = 'none';

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/all\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Unauthorized');

                const data = await response.json();
                allComments = data.data.comments;
                
                // 填充页面过滤器
                const pageFilter = document.getElementById('page-filter');
                const pages = [...new Set(allComments.map(c => c.page_url))];
                pageFilter.innerHTML = '<option value="">所有页面</option>' + 
                    pages.map(url => \`<option value="\${url}">\${truncate(url, 50)}</option>\`).join('');
                
                renderComments(allComments);
                loadingEl.style.display = 'none';
                tableEl.style.display = 'table';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('加载评论失败', 'error');
            }
        }

        function renderComments(comments) {
            const tbody = document.getElementById('comments-tbody');
            tbody.innerHTML = comments.map(comment => \`
                <tr>
                    <td><input type="checkbox" class="comment-checkbox" value="\${comment.id}"></td>
                    <td>\${comment.id}</td>
                    <td title="\${comment.page_url}">\${truncate(comment.page_url, 30)}</td>
                    <td>\${comment.author_name}</td>
                    <td class="comment-content" title="\${comment.content}">\${truncate(comment.content, 50)}</td>
                    <td>\${formatDate(comment.created_at)}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteComment(\${comment.id})">删除</button>
                    </td>
                </tr>
            \`).join('');
        }

        function viewPageComments(pageUrl) {
            currentPageUrl = pageUrl;
            document.getElementById('page-filter').value = pageUrl;
            showTab('comments');
            filterComments();
        }

        function filterComments() {
            const pageUrl = document.getElementById('page-filter').value;
            const filteredComments = pageUrl ? allComments.filter(c => c.page_url === pageUrl) : allComments;
            renderComments(filteredComments);
        }

        function toggleSelectAll() {
            const selectAll = document.getElementById('select-all');
            const checkboxes = document.querySelectorAll('.comment-checkbox');
            checkboxes.forEach(checkbox => checkbox.checked = selectAll.checked);
        }

        async function batchDelete() {
            const selectedIds = Array.from(document.querySelectorAll('.comment-checkbox:checked')).map(cb => cb.value);
            
            if (selectedIds.length === 0) {
                showAdminMessage('请选择要删除的评论', 'error');
                return;
            }

            if (!confirm(\`确定要删除 \${selectedIds.length} 条评论吗？\`)) {
                return;
            }

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/batch\`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ids: selectedIds })
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('批量删除成功', 'success');
                    await loadComments();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '批量删除失败', 'error');
                }
            } catch (error) {
                showAdminMessage('批量删除失败', 'error');
            }
        }

        async function deleteComment(commentId) {
            if (!confirm('确定要删除这条评论吗？')) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/\${commentId}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('评论删除成功', 'success');
                    await loadComments();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '删除失败', 'error');
                }
            } catch (error) {
                showAdminMessage('删除失败', 'error');
            }
        }

        async function deletePageComments(pageUrl) {
            if (!confirm(\`确定要删除页面 "\${pageUrl}" 的所有评论吗？\`)) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/page\`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ pageUrl })
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('页面评论删除成功', 'success');
                    await loadPages();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '删除失败', 'error');
                }
            } catch (error) {
                showAdminMessage('删除失败', 'error');
            }
        }

        async function loadWhitelist() {
            const loadingEl = document.getElementById('whitelist-loading');
            const listEl = document.getElementById('whitelist-list');
            
            loadingEl.style.display = 'block';
            listEl.innerHTML = '';

            try {
                const response = await fetch(\`\${apiUrl}/api/whitelist\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Unauthorized');

                const data = await response.json();
                const whitelist = data.data.whitelist;
                
                listEl.innerHTML = whitelist.map(item => \`
                    <div class="whitelist-item">
                        <div>
                            <strong>\${item.domain}</strong>
                            \${item.description ? \`<br><small>\${item.description}</small>\` : ''}
                        </div>
                        <button class="btn btn-danger" onclick="removeFromWhitelist(\${item.id})">删除</button>
                    </div>
                \`).join('');

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('加载白名单失败', 'error');
            }
        }

        function showAddWhitelistModal() {
            document.getElementById('whitelist-modal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('whitelist-modal').style.display = 'none';
        }

        document.getElementById('whitelist-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const domain = document.getElementById('domain').value.trim();
            const description = document.getElementById('description').value.trim();

            try {
                const response = await fetch(\`\${apiUrl}/api/whitelist\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ domain, description })
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('添加成功', 'success');
                    closeModal();
                    await loadWhitelist();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '添加失败', 'error');
                }
            } catch (error) {
                showAdminMessage('添加失败', 'error');
            }
        });

        async function removeFromWhitelist(id) {
            if (!confirm('确定要从白名单中删除吗？')) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/whitelist/\${id}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('删除成功', 'success');
                    await loadWhitelist();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '删除失败', 'error');
                }
            } catch (error) {
                showAdminMessage('删除失败', 'error');
            }
        }

        function truncate(str, length) {
            return str.length > length ? str.substring(0, length) + '...' : str;
        }

        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString.replace(' ', 'T'));
            return date.toLocaleString('zh-CN');
        }

        // 通知设置相关函数
        async function loadNotificationSettings() {
            await loadNotifiersStatus();
            await loadNotificationConfig();
            await loadEmailSubscribers();
        }

        async function loadNotifiersStatus() {
            const statusEl = document.getElementById('notifiers-status');
            
            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/notifiers\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Failed to load notifiers');

                const data = await response.json();
                const notifiers = data.data.notifiers;
                
                statusEl.innerHTML = Object.entries(notifiers).map(([type, info]) => \`
                    <div class="notifier-status" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 10px; background: \${info.configured ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
                        <div>
                            <strong>\${info.name}</strong>
                            <br><small>\${info.description}</small>
                        </div>
                        <div style="text-align: right;">
                            <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; background: \${info.configured ? '#28a745' : '#dc3545'};">
                                \${info.configured ? '✅ 已配置' : '❌ 未配置'}
                            </span>
                            \${!info.configured ? \`<br><small style="color: #666;">需要: \${info.requiredEnvVars.join(', ')}</small>\` : ''}
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                statusEl.innerHTML = '<p style="color: #dc3545;">加载推送器状态失败</p>';
            }
        }

        async function loadNotificationConfig() {
            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/config\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Failed to load config');

                const data = await response.json();
                const config = data.data || {};
                
                // 填充邮箱配置
                const emailConfig = config.email || {};
                document.getElementById('email-enabled').checked = emailConfig.enabled || false;
                document.getElementById('admin-emails').value = (emailConfig.recipients || []).join(', ');
                document.getElementById('include-page-info').checked = emailConfig.includePageInfo !== false;
                document.getElementById('include-comment-content').checked = emailConfig.includeCommentContent !== false;
                
                toggleEmailConfig();

                // 加载Telegram配置
                const telegramConfig = config.telegram || {};
                document.getElementById('telegram-enabled').checked = telegramConfig.enabled || false;
                document.getElementById('telegram-chat-ids').value = (telegramConfig.chatIds || []).join(', ');
                document.getElementById('telegram-include-page-info').checked = telegramConfig.includePageInfo !== false;
                document.getElementById('telegram-include-comment-content').checked = telegramConfig.includeCommentContent !== false;
                
                toggleTelegramConfig();
            } catch (error) {
                console.error('加载通知配置失败:', error);
            }
        }

        function toggleEmailConfig() {
            const enabled = document.getElementById('email-enabled').checked;
            document.getElementById('email-config').style.display = enabled ? 'block' : 'none';
        }

        function toggleTelegramConfig() {
            const enabled = document.getElementById('telegram-enabled').checked;
            document.getElementById('telegram-config').style.display = enabled ? 'block' : 'none';
        }

        // 绑定邮箱启用复选框事件
        document.getElementById('email-enabled').addEventListener('change', toggleEmailConfig);

        // 绑定Telegram启用复选框事件
        document.getElementById('telegram-enabled').addEventListener('change', toggleTelegramConfig);

        // 绑定邮箱配置表单提交事件
        document.getElementById('email-notification-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveNotificationConfig();
        });

        // 绑定Telegram配置表单提交事件
        document.getElementById('telegram-notification-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveNotificationConfig();
        });

        async function saveNotificationConfig() {
            try {
                const emailEnabled = document.getElementById('email-enabled').checked;
                const adminEmails = document.getElementById('admin-emails').value
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email);

                const telegramEnabled = document.getElementById('telegram-enabled').checked;
                const telegramChatIds = document.getElementById('telegram-chat-ids').value
                    .split(',')
                    .map(chatId => chatId.trim())
                    .filter(chatId => chatId);
                    
                const config = {
                    email: {
                        enabled: emailEnabled,
                        recipients: adminEmails,
                        subscribers: [], // 保持现有订阅者
                        includePageInfo: document.getElementById('include-page-info').checked,
                        includeCommentContent: document.getElementById('include-comment-content').checked,
                        template: 'default'
                    },
                    telegram: {
                        enabled: telegramEnabled,
                        chatIds: telegramChatIds,
                        includePageInfo: document.getElementById('telegram-include-page-info').checked,
                        includeCommentContent: document.getElementById('telegram-include-comment-content').checked,
                        template: 'default'
                    }
                };

                const response = await fetch(\`\${apiUrl}/api/notifications/config\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });

                const data = await response.json();
                if (data.success) {
                    showNotificationMessage('通知配置保存成功', 'success');
                } else {
                    showNotificationMessage(data.message || '保存失败', 'error');
                }
            } catch (error) {
                showNotificationMessage('保存配置失败', 'error');
            }
        }

        async function testEmailNotification() {
            const testEmail = prompt('请输入测试邮箱地址:');
            if (!testEmail) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/test\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'email',
                        config: { testEmail }
                    })
                });

                const data = await response.json();
                if (data.success) {
                    showNotificationMessage(\`测试邮件已发送到 \${testEmail}\`, 'success');
                } else {
                    showNotificationMessage(data.message || '测试失败', 'error');
                }
            } catch (error) {
                showNotificationMessage('测试邮件发送失败', 'error');
            }
        }

        async function testTelegramNotification() {
            const testChatId = prompt('请输入测试Chat ID:');
            if (!testChatId) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/test\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${adminToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'telegram',
                        config: { testChatId }
                    })
                });

                const data = await response.json();
                if (data.success) {
                    showNotificationMessage(\`测试消息已发送到 Chat ID: \${testChatId}\`, 'success');
                } else {
                    showNotificationMessage(data.message || '测试失败', 'error');
                }
            } catch (error) {
                showNotificationMessage('测试Telegram推送失败', 'error');
            }
        }

        async function loadEmailSubscribers() {
            const loadingEl = document.getElementById('subscribers-loading');
            const listEl = document.getElementById('subscribers-list');
            
            loadingEl.style.display = 'block';
            listEl.innerHTML = '';

            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/subscribers\`, {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                if (!response.ok) throw new Error('Failed to load subscribers');

                const data = await response.json();
                const subscribers = data.data.subscribers || [];
                
                if (subscribers.length === 0) {
                    listEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">暂无邮件订阅者</p>';
                } else {
                    listEl.innerHTML = subscribers.map(subscriber => \`
                        <div class="whitelist-item">
                            <div>
                                <strong>\${subscriber.email}</strong>
                                \${subscriber.name && subscriber.name !== subscriber.email.split('@')[0] ? \`<br><small>\${subscriber.name}</small>\` : ''}
                                \${subscriber.page_url ? \`<br><small>页面: \${subscriber.page_url}</small>\` : ''}
                                <br><small>订阅时间: \${formatDate(subscriber.subscribed_at)}</small>
                            </div>
                            <button class="btn btn-danger" onclick="removeEmailSubscriber('\${subscriber.email}')">删除</button>
                        </div>
                    \`).join('');
                }

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                listEl.innerHTML = '<p style="color: #dc3545;">加载订阅者失败</p>';
            }
        }

        async function removeEmailSubscriber(email) {
            if (!confirm(\`确定要删除订阅者 \${email} 吗？\`)) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/subscribe/\${encodeURIComponent(email)}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showNotificationMessage('订阅者删除成功', 'success');
                    await loadEmailSubscribers();
                } else {
                    showNotificationMessage(data.message || '删除失败', 'error');
                }
            } catch (error) {
                showNotificationMessage('删除订阅者失败', 'error');
            }
        }

        function showNotificationMessage(message, type) {
            const messageEl = document.getElementById('notification-status');
            messageEl.className = \`alert alert-\${type}\`;
            messageEl.textContent = message;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    </script>
</body>
</html>`;

  return htmlResponse(html);
}