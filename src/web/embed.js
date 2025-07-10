const embedScript = `
(function() {
  'use strict';

  // 头像工具函数
  function getQQAvatar(qq) {
    if (!qq || !/^\\d+$/.test(qq)) {
      return null;
    }
    return \`https://q1.qlogo.cn/g?b=qq&nk=\${qq}&s=100\`;
  }

  function getGitHubStyleAvatar(seed) {
    const hash = simpleHash(seed || 'anonymous');
    return \`https://api.dicebear.com/7.x/pixel-art/svg?seed=\${hash}&size=100\`;
  }

  function simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  function getAvatarUrl(authorName, authorEmail, authorQQ) {
    if (authorQQ) {
      const qqAvatar = getQQAvatar(authorQQ);
      if (qqAvatar) {
        return qqAvatar;
      }
    }
    const seed = authorEmail || authorName || 'anonymous';
    return getGitHubStyleAvatar(seed);
  }

  function preloadAvatar(url, fallbackUrl = null) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => {
        if (fallbackUrl) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackUrl);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = fallbackUrl;
        } else {
          resolve(null);
        }
      };
      img.src = url;
    });
  }

  // 默认配置
  const defaultConfig = {
    apiUrl: '{{API_URL}}',
    pageUrl: window.location.href,
    placeholder: '说点什么吧...',
    maxLength: 1000,
    requireName: true,
    requireEmail: false
  };

  // 合并用户配置
  const config = Object.assign({}, defaultConfig, window.lzreviewConfig || {});

  // 评论系统类
  class LzReview {
    constructor(config) {
      this.config = config;
      this.container = document.getElementById('lzreview-comments');
      this.comments = [];
      this.csrfToken = null;
      
      if (!this.container) {
        console.error('lzreview: 找不到容器元素 #lzreview-comments');
        return;
      }

      this.init();
    }

    async init() {
      this.injectStyles();
      await this.loadCSRFToken();
      await this.loadComments();
      this.render();
    }

    injectStyles() {
      if (document.getElementById('lzreview-styles')) return;

      const styles = \`
        .lzreview-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 100%;
          margin: 0;
          color: #333;
          line-height: 1.6;
        }
        .lzreview-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #e1e5e9;
        }
        .lzreview-form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        .lzreview-form-group {
          flex: 1;
        }
        .lzreview-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }
        .lzreview-input, .lzreview-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .lzreview-textarea {
          min-height: 100px;
          max-height: 200px;
          height: 100px;
          resize: none;
        }
        .lzreview-button {
          background: #007cba;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .lzreview-button:hover { background: #005a87; }
        .lzreview-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .lzreview-comments-list {
          margin-top: 30px;
        }
        .lzreview-comment {
          border-bottom: 1px solid #eee;
          padding: 20px 0;
        }
        .lzreview-comment:last-child { border-bottom: none; }
        .lzreview-comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }
        .lzreview-comment-author {
          font-weight: 500;
          color: #333;
        }
        .lzreview-comment-email {
          font-weight: 400;
          color: #666;
          font-size: 12px;
        }
        .lzreview-avatar-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .lzreview-avatar-preview img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid #ddd;
          object-fit: cover;
        }
        .lzreview-comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #ddd;
          object-fit: cover;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .lzreview-comment-header-with-avatar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }
        .lzreview-comment-author-info {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .lzreview-comment-actions {
          margin-top: 8px;
          margin-bottom: 10px;
        }
        .lzreview-reply-button {
          background: transparent;
          border: 1px solid #ddd;
          color: #666;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .lzreview-reply-button:hover {
          background: #f5f5f5;
          border-color: #007cba;
          color: #007cba;
        }
        .lzreview-reply-form {
          margin-top: 10px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }
        .lzreview-reply-form .lzreview-textarea {
          height: 80px;
          margin-bottom: 10px;
        }
        .lzreview-reply-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .lzreview-button-small {
          padding: 6px 12px;
          font-size: 12px;
        }
        .lzreview-button-cancel {
          background: #6c757d;
          color: white;
          padding: 6px 12px;
          font-size: 12px;
        }
        .lzreview-button-cancel:hover {
          background: #5a6268;
        }
        .lzreview-comment-content {
          margin-bottom: 10px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .lzreview-replies {
          margin-left: 20px;
          margin-top: 15px;
          border-left: 3px solid #f0f0f0;
          padding-left: 15px;
        }
        .lzreview-error {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border: 1px solid #f5c6cb;
        }
        .lzreview-success {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border: 1px solid #c3e6cb;
        }
        .lzreview-loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        .lzreview-char-count {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .lzreview-char-count.warning { color: #e74c3c; }
        @media (max-width: 768px) {
          .lzreview-form-row { flex-direction: column; }
          .lzreview-replies { margin-left: 10px; padding-left: 10px; }
        }
      \`;

      const styleEl = document.createElement('style');
      styleEl.id = 'lzreview-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }

    async loadCSRFToken() {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/comments/csrf-token\`);
        const data = await response.json();
        if (data.success) {
          this.csrfToken = data.data.csrfToken;
        }
      } catch (error) {
        console.error('加载CSRF令牌失败:', error);
      }
    }

    async loadComments() {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/comments?page=\${encodeURIComponent(this.config.pageUrl)}\`);
        const data = await response.json();
        
        if (data.success) {
          this.comments = data.data.comments;
        } else {
          console.error('加载评论失败:', data.message);
          // 如果是白名单限制，显示错误信息
          if (response.status === 403) {
            this.showWhitelistError(data.message);
          }
        }
      } catch (error) {
        console.error('加载评论失败:', error);
      }
    }

    render() {
      this.container.innerHTML = \`
        <div class="lzreview-container">
          <div class="lzreview-form">
            <h3 style="margin-top: 0;">发表评论</h3>
            <div id="lzreview-message"></div>
            <form id="lzreview-comment-form">
              <div class="lzreview-form-row">
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-name">姓名 *</label>
                  <input type="text" id="author-name" class="lzreview-input" required maxlength="50">
                </div>
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-email">邮箱（可选）</label>
                  <input type="email" id="author-email" class="lzreview-input">
                </div>
              </div>
              <div class="lzreview-form-row">
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-qq">QQ号（可选）</label>
                  <input type="text" id="author-qq" class="lzreview-input" placeholder="填写QQ号将使用QQ头像">
                </div>
                <div class="lzreview-form-group">
                  <div class="lzreview-avatar-preview">
                    <img id="avatar-preview" src="" alt="头像预览" style="display: none;">
                  </div>
                </div>
              </div>
              <div class="lzreview-form-group">
                <label class="lzreview-label" for="comment-content">评论内容 *</label>
                <textarea id="comment-content" class="lzreview-textarea" placeholder="\${this.config.placeholder}" required maxlength="\${this.config.maxLength}"></textarea>
                <div class="lzreview-char-count" id="char-count">0/\${this.config.maxLength}</div>
              </div>
              <button type="submit" class="lzreview-button" id="submit-button">发布评论</button>
            </form>
          </div>
          <div class="lzreview-comments-list">
            <h3>评论列表 (\${this.comments.length})</h3>
            <div id="comments-container">
              \${this.comments.length > 0 ? this.renderComments(this.comments) : '<p style="color: #666; text-align: center; padding: 20px;">暂无评论，快来发表第一条评论吧！</p>'}
            </div>
          </div>
        </div>
      \`;

      this.bindEvents();
    }

    renderComments(comments) {
      return comments.map(comment => {
        const avatarUrl = getAvatarUrl(comment.author_name, comment.author_email, comment.author_qq);
        return \`
        <div class="lzreview-comment">
          <div class="lzreview-comment-header-with-avatar">
            <div class="lzreview-comment-author-info">
              <img class="lzreview-comment-avatar" src="\${avatarUrl}" alt="\${this.escapeHtml(comment.author_name)}的头像">
              <span class="lzreview-comment-author">
                \${this.escapeHtml(comment.author_name)}
                \${comment.author_email ? \`<span class="lzreview-comment-email"> (\${this.escapeHtml(comment.author_email)})</span>\` : ''}
              </span>
            </div>
            <span class="lzreview-comment-time">\${this.formatDate(comment.created_at)}</span>
          </div>
          <div class="lzreview-comment-content">\${this.escapeHtml(comment.content)}</div>
          <div class="lzreview-comment-actions">
            <button class="lzreview-reply-button" onclick="toggleReplyForm(\${comment.id})">回复</button>
          </div>
          <div id="reply-form-\${comment.id}" class="lzreview-reply-form" style="display: none;">
            <div class="lzreview-form-row">
              <div class="lzreview-form-group">
                <label class="lzreview-label">姓名 *</label>
                <input type="text" id="reply-author-name-\${comment.id}" class="lzreview-input" required maxlength="50" placeholder="请输入您的姓名">
              </div>
              <div class="lzreview-form-group">
                <label class="lzreview-label">邮箱（可选）</label>
                <input type="email" id="reply-author-email-\${comment.id}" class="lzreview-input" placeholder="请输入您的邮箱">
              </div>
            </div>
            <div class="lzreview-form-row">
              <div class="lzreview-form-group">
                <label class="lzreview-label">QQ号（可选）</label>
                <input type="text" id="reply-author-qq-\${comment.id}" class="lzreview-input" placeholder="填写QQ号将使用QQ头像">
              </div>
            </div>
            <textarea id="reply-content-\${comment.id}" class="lzreview-textarea" placeholder="回复 \${this.escapeHtml(comment.author_name)}..." maxlength="\${this.config.maxLength}"></textarea>
            <div class="lzreview-reply-actions">
              <button class="lzreview-button lzreview-button-small" onclick="submitReply(\${comment.id})">发布回复</button>
              <button class="lzreview-button lzreview-button-cancel" onclick="toggleReplyForm(\${comment.id})">取消</button>
            </div>
          </div>
          \${comment.replies && comment.replies.length > 0 ? \`
            <div class="lzreview-replies">
              \${this.renderComments(comment.replies)}
            </div>
          \` : ''}
        </div>
        \`;
      }).join('');
    }

    bindEvents() {
      const form = document.getElementById('lzreview-comment-form');
      const contentTextarea = document.getElementById('comment-content');
      const charCount = document.getElementById('char-count');
      const submitButton = document.getElementById('submit-button');
      const authorNameInput = document.getElementById('author-name');
      const authorEmailInput = document.getElementById('author-email');
      const authorQQInput = document.getElementById('author-qq');
      const avatarPreview = document.getElementById('avatar-preview');

      // 头像预览更新函数
      const updateAvatarPreview = async () => {
        const name = authorNameInput.value.trim();
        const email = authorEmailInput.value.trim();
        const qq = authorQQInput.value.trim();
        
        if (name || email || qq) {
          const avatarUrl = getAvatarUrl(name, email, qq);
          const validUrl = await preloadAvatar(avatarUrl);
          if (validUrl) {
            avatarPreview.src = validUrl;
            avatarPreview.style.display = 'block';
          } else {
            avatarPreview.style.display = 'none';
          }
        } else {
          avatarPreview.style.display = 'none';
        }
      };

      // 监听输入变化以更新头像预览
      authorNameInput.addEventListener('input', updateAvatarPreview);
      authorEmailInput.addEventListener('input', updateAvatarPreview);
      authorQQInput.addEventListener('input', updateAvatarPreview);

      // 字符计数
      contentTextarea.addEventListener('input', () => {
        const length = contentTextarea.value.length;
        charCount.textContent = \`\${length}/\${this.config.maxLength}\`;
        charCount.className = \`lzreview-char-count \${length > this.config.maxLength * 0.9 ? 'warning' : ''}\`;
      });

      // 表单提交
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitComment();
      });

      // 初始化头像预览
      updateAvatarPreview();
    }

    async submitComment() {
      const authorName = document.getElementById('author-name').value.trim();
      const authorEmail = document.getElementById('author-email').value.trim();
      const authorQQ = document.getElementById('author-qq').value.trim();
      const content = document.getElementById('comment-content').value.trim();
      const submitButton = document.getElementById('submit-button');
      const messageEl = document.getElementById('lzreview-message');

      // 清除之前的消息
      messageEl.innerHTML = '';

      // 验证
      if (!authorName || !content) {
        this.showMessage('请填写必填字段', 'error');
        return;
      }

      if (content.length > this.config.maxLength) {
        this.showMessage(\`评论内容不能超过\${this.config.maxLength}个字符\`, 'error');
        return;
      }

      if (this.config.requireEmail && !authorEmail) {
        this.showMessage('请填写邮箱地址', 'error');
        return;
      }

      // 提交评论
      submitButton.disabled = true;
      submitButton.textContent = '发布中...';

      try {
        const payload = {
          pageUrl: this.config.pageUrl,
          authorName,
          authorEmail: authorEmail || null,
          authorQQ: authorQQ || null,
          content,
          csrfToken: this.csrfToken
        };
        const response = await fetch(\`\${this.config.apiUrl}/api/comments\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.success) {
          this.showMessage('评论发布成功！', 'success');
          document.getElementById('lzreview-comment-form').reset();
          document.getElementById('char-count').textContent = \`0/\${this.config.maxLength}\`;
          
          // 重新加载评论
          await this.loadComments();
          this.updateCommentsList();
        } else {
          console.error('Server error:', data);
          // 如果是白名单限制，显示特殊错误页面
          if (response.status === 403 && data.message.includes('白名单')) {
            this.showWhitelistError(data.message);
            return;
          }
          this.showMessage(data.message || '评论发布失败', 'error');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        this.showMessage('网络错误，请稍后重试', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = '发布评论';
      }
    }

    updateCommentsList() {
      const container = document.getElementById('comments-container');
      container.innerHTML = this.comments.length > 0 
        ? this.renderComments(this.comments)
        : '<p style="color: #666; text-align: center; padding: 20px;">暂无评论，快来发表第一条评论吧！</p>';
    }

    showMessage(message, type) {
      const messageEl = document.getElementById('lzreview-message');
      // 安全的DOM操作，避免XSS
      messageEl.innerHTML = '';
      const div = document.createElement('div');
      div.className = \`lzreview-\${type}\`;
      div.textContent = message; // 使用textContent而不是innerHTML
      messageEl.appendChild(div);
    }

    showWhitelistError(message) {
      // 安全的DOM操作，避免XSS
      this.container.innerHTML = '';
      
      const container = document.createElement('div');
      container.className = 'lzreview-container';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'lzreview-error';
      errorDiv.style.cssText = 'text-align: center; padding: 40px; margin: 20px 0;';
      
      const title = document.createElement('h3');
      title.style.cssText = 'color: #721c24; margin-bottom: 15px;';
      title.textContent = '评论系统访问受限';
      
      const messageP = document.createElement('p');
      messageP.style.cssText = 'margin-bottom: 20px; font-size: 16px;';
      messageP.textContent = message;
      
      const helpP = document.createElement('p');
      helpP.style.cssText = 'color: #6c757d; font-size: 14px;';
      helpP.textContent = '如需使用评论功能，请联系网站管理员将当前域名添加到白名单中。';
      
      errorDiv.appendChild(title);
      errorDiv.appendChild(messageP);
      errorDiv.appendChild(helpP);
      container.appendChild(errorDiv);
      this.container.appendChild(container);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    formatDate(dateString) {
      // 数据库存储的已经是中国时间，直接解析即可
      const date = new Date(dateString.replace(' ', 'T'));
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return \`\${Math.floor(diff / 60000)}分钟前\`;
      if (diff < 86400000) return \`\${Math.floor(diff / 3600000)}小时前\`;
      if (diff < 2592000000) return \`\${Math.floor(diff / 86400000)}天前\`;
      
      return date.toLocaleDateString('zh-CN');
    }

    async submitReply(parentId) {
      const replyContent = document.getElementById(\`reply-content-\${parentId}\`).value.trim();
      const authorName = document.getElementById(\`reply-author-name-\${parentId}\`).value.trim();
      const authorEmail = document.getElementById(\`reply-author-email-\${parentId}\`).value.trim();
      const authorQQ = document.getElementById(\`reply-author-qq-\${parentId}\`).value.trim();
      
      if (!authorName) {
        this.showMessage('请填写姓名', 'error');
        return;
      }
      
      if (!replyContent) {
        this.showMessage('请填写回复内容', 'error');
        return;
      }

      try {
        const payload = {
          pageUrl: this.config.pageUrl,
          authorName,
          authorEmail: authorEmail || null,
          authorQQ: authorQQ || null,
          content: replyContent,
          parentId: parentId,
          csrfToken: this.csrfToken
        };

        const response = await fetch(\`\${this.config.apiUrl}/api/comments\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
          this.showMessage('回复发布成功！', 'success');
          document.getElementById(\`reply-content-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-name-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-email-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-qq-\${parentId}\`).value = '';
          document.getElementById(\`reply-form-\${parentId}\`).style.display = 'none';
          
          // 重新加载评论
          await this.loadComments();
          this.updateCommentsList();
        } else {
          // 如果是白名单限制，显示特殊错误页面
          if (response.status === 403 && data.message.includes('白名单')) {
            this.showWhitelistError(data.message);
            return;
          }
          this.showMessage(data.message || '回复发布失败', 'error');
        }
      } catch (error) {
        console.error('提交回复失败:', error);
        this.showMessage('网络错误，请稍后重试', 'error');
      }
    }

    toggleReplyForm(commentId) {
      const replyForm = document.getElementById(\`reply-form-\${commentId}\`);
      if (replyForm.style.display === 'none') {
        replyForm.style.display = 'block';
      } else {
        replyForm.style.display = 'none';
      }
    }
  }

  // 全局变量存储实例
  let lzReviewInstance = null;

  // 全局函数
  window.toggleReplyForm = function(commentId) {
    if (lzReviewInstance) {
      lzReviewInstance.toggleReplyForm(commentId);
    }
  };

  window.submitReply = function(parentId) {
    if (lzReviewInstance) {
      lzReviewInstance.submitReply(parentId);
    }
  };

  // 初始化评论系统
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      lzReviewInstance = new LzReview(config);
    });
  } else {
    lzReviewInstance = new LzReview(config);
  }
})();
`;

export default embedScript;