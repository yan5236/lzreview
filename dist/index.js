var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/web/embed.js
var embed_exports = {};
__export(embed_exports, {
  default: () => embed_default
});
var embedScript, embed_default;
var init_embed = __esm({
  "src/web/embed.js"() {
    embedScript = `
(function() {
  'use strict';

  // \u5934\u50CF\u5DE5\u5177\u51FD\u6570
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

  // \u9ED8\u8BA4\u914D\u7F6E
  const defaultConfig = {
    apiUrl: '{{API_URL}}',
    pageUrl: window.location.href,
    placeholder: '\u8BF4\u70B9\u4EC0\u4E48\u5427...',
    maxLength: 1000,
    requireName: true,
    requireEmail: false
  };

  // \u5408\u5E76\u7528\u6237\u914D\u7F6E
  const config = Object.assign({}, defaultConfig, window.lzreviewConfig || {});

  // \u8BC4\u8BBA\u7CFB\u7EDF\u7C7B
  class LzReview {
    constructor(config) {
      this.config = config;
      this.container = document.getElementById('lzreview-comments');
      this.comments = [];
      this.csrfToken = null;
      
      if (!this.container) {
        console.error('lzreview: \u627E\u4E0D\u5230\u5BB9\u5668\u5143\u7D20 #lzreview-comments');
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
        console.error('\u52A0\u8F7DCSRF\u4EE4\u724C\u5931\u8D25:', error);
      }
    }

    async loadComments() {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/comments?page=\${encodeURIComponent(this.config.pageUrl)}\`);
        const data = await response.json();
        
        if (data.success) {
          this.comments = data.data.comments;
        } else {
          console.error('\u52A0\u8F7D\u8BC4\u8BBA\u5931\u8D25:', data.message);
          // \u5982\u679C\u662F\u767D\u540D\u5355\u9650\u5236\uFF0C\u663E\u793A\u9519\u8BEF\u4FE1\u606F
          if (response.status === 403) {
            this.showWhitelistError(data.message);
          }
        }
      } catch (error) {
        console.error('\u52A0\u8F7D\u8BC4\u8BBA\u5931\u8D25:', error);
      }
    }

    render() {
      this.container.innerHTML = \`
        <div class="lzreview-container">
          <div class="lzreview-form">
            <h3 style="margin-top: 0;">\u53D1\u8868\u8BC4\u8BBA</h3>
            <div id="lzreview-message"></div>
            <form id="lzreview-comment-form">
              <div class="lzreview-form-row">
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-name">\u59D3\u540D *</label>
                  <input type="text" id="author-name" class="lzreview-input" required maxlength="50">
                </div>
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-email">\u90AE\u7BB1\uFF08\u53EF\u9009\uFF09</label>
                  <input type="email" id="author-email" class="lzreview-input">
                </div>
              </div>
              <div class="lzreview-form-row">
                <div class="lzreview-form-group">
                  <label class="lzreview-label" for="author-qq">QQ\u53F7\uFF08\u53EF\u9009\uFF09</label>
                  <input type="text" id="author-qq" class="lzreview-input" placeholder="\u586B\u5199QQ\u53F7\u5C06\u4F7F\u7528QQ\u5934\u50CF">
                </div>
                <div class="lzreview-form-group">
                  <div class="lzreview-avatar-preview">
                    <img id="avatar-preview" src="" alt="\u5934\u50CF\u9884\u89C8" style="display: none;">
                  </div>
                </div>
              </div>
              <div class="lzreview-form-group">
                <label class="lzreview-label" for="comment-content">\u8BC4\u8BBA\u5185\u5BB9 *</label>
                <textarea id="comment-content" class="lzreview-textarea" placeholder="\${this.config.placeholder}" required maxlength="\${this.config.maxLength}"></textarea>
                <div class="lzreview-char-count" id="char-count">0/\${this.config.maxLength}</div>
              </div>
              <button type="submit" class="lzreview-button" id="submit-button">\u53D1\u5E03\u8BC4\u8BBA</button>
            </form>
          </div>
          <div class="lzreview-comments-list">
            <h3>\u8BC4\u8BBA\u5217\u8868 (\${this.comments.length})</h3>
            <div id="comments-container">
              \${this.comments.length > 0 ? this.renderComments(this.comments) : '<p style="color: #666; text-align: center; padding: 20px;">\u6682\u65E0\u8BC4\u8BBA\uFF0C\u5FEB\u6765\u53D1\u8868\u7B2C\u4E00\u6761\u8BC4\u8BBA\u5427\uFF01</p>'}
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
              <img class="lzreview-comment-avatar" src="\${avatarUrl}" alt="\${this.escapeHtml(comment.author_name)}\u7684\u5934\u50CF">
              <span class="lzreview-comment-author">
                \${this.escapeHtml(comment.author_name)}
                \${comment.author_email ? \`<span class="lzreview-comment-email"> (\${this.escapeHtml(comment.author_email)})</span>\` : ''}
              </span>
            </div>
            <span class="lzreview-comment-time">\${this.formatDate(comment.created_at)}</span>
          </div>
          <div class="lzreview-comment-content">\${this.escapeHtml(comment.content)}</div>
          <div class="lzreview-comment-actions">
            <button class="lzreview-reply-button" onclick="toggleReplyForm(\${comment.id})">\u56DE\u590D</button>
          </div>
          <div id="reply-form-\${comment.id}" class="lzreview-reply-form" style="display: none;">
            <div class="lzreview-form-row">
              <div class="lzreview-form-group">
                <label class="lzreview-label">\u59D3\u540D *</label>
                <input type="text" id="reply-author-name-\${comment.id}" class="lzreview-input" required maxlength="50" placeholder="\u8BF7\u8F93\u5165\u60A8\u7684\u59D3\u540D">
              </div>
              <div class="lzreview-form-group">
                <label class="lzreview-label">\u90AE\u7BB1\uFF08\u53EF\u9009\uFF09</label>
                <input type="email" id="reply-author-email-\${comment.id}" class="lzreview-input" placeholder="\u8BF7\u8F93\u5165\u60A8\u7684\u90AE\u7BB1">
              </div>
            </div>
            <div class="lzreview-form-row">
              <div class="lzreview-form-group">
                <label class="lzreview-label">QQ\u53F7\uFF08\u53EF\u9009\uFF09</label>
                <input type="text" id="reply-author-qq-\${comment.id}" class="lzreview-input" placeholder="\u586B\u5199QQ\u53F7\u5C06\u4F7F\u7528QQ\u5934\u50CF">
              </div>
            </div>
            <textarea id="reply-content-\${comment.id}" class="lzreview-textarea" placeholder="\u56DE\u590D \${this.escapeHtml(comment.author_name)}..." maxlength="\${this.config.maxLength}"></textarea>
            <div class="lzreview-reply-actions">
              <button class="lzreview-button lzreview-button-small" onclick="submitReply(\${comment.id})">\u53D1\u5E03\u56DE\u590D</button>
              <button class="lzreview-button lzreview-button-cancel" onclick="toggleReplyForm(\${comment.id})">\u53D6\u6D88</button>
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

      // \u5934\u50CF\u9884\u89C8\u66F4\u65B0\u51FD\u6570
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

      // \u76D1\u542C\u8F93\u5165\u53D8\u5316\u4EE5\u66F4\u65B0\u5934\u50CF\u9884\u89C8
      authorNameInput.addEventListener('input', updateAvatarPreview);
      authorEmailInput.addEventListener('input', updateAvatarPreview);
      authorQQInput.addEventListener('input', updateAvatarPreview);

      // \u5B57\u7B26\u8BA1\u6570
      contentTextarea.addEventListener('input', () => {
        const length = contentTextarea.value.length;
        charCount.textContent = \`\${length}/\${this.config.maxLength}\`;
        charCount.className = \`lzreview-char-count \${length > this.config.maxLength * 0.9 ? 'warning' : ''}\`;
      });

      // \u8868\u5355\u63D0\u4EA4
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitComment();
      });

      // \u521D\u59CB\u5316\u5934\u50CF\u9884\u89C8
      updateAvatarPreview();
    }

    async submitComment() {
      const authorName = document.getElementById('author-name').value.trim();
      const authorEmail = document.getElementById('author-email').value.trim();
      const authorQQ = document.getElementById('author-qq').value.trim();
      const content = document.getElementById('comment-content').value.trim();
      const submitButton = document.getElementById('submit-button');
      const messageEl = document.getElementById('lzreview-message');

      // \u6E05\u9664\u4E4B\u524D\u7684\u6D88\u606F
      messageEl.innerHTML = '';

      // \u9A8C\u8BC1
      if (!authorName || !content) {
        this.showMessage('\u8BF7\u586B\u5199\u5FC5\u586B\u5B57\u6BB5', 'error');
        return;
      }

      if (content.length > this.config.maxLength) {
        this.showMessage(\`\u8BC4\u8BBA\u5185\u5BB9\u4E0D\u80FD\u8D85\u8FC7\${this.config.maxLength}\u4E2A\u5B57\u7B26\`, 'error');
        return;
      }

      if (this.config.requireEmail && !authorEmail) {
        this.showMessage('\u8BF7\u586B\u5199\u90AE\u7BB1\u5730\u5740', 'error');
        return;
      }

      // \u63D0\u4EA4\u8BC4\u8BBA
      submitButton.disabled = true;
      submitButton.textContent = '\u53D1\u5E03\u4E2D...';

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
          this.showMessage('\u8BC4\u8BBA\u53D1\u5E03\u6210\u529F\uFF01', 'success');
          document.getElementById('lzreview-comment-form').reset();
          document.getElementById('char-count').textContent = \`0/\${this.config.maxLength}\`;
          
          // \u91CD\u65B0\u52A0\u8F7D\u8BC4\u8BBA
          await this.loadComments();
          this.updateCommentsList();
        } else {
          console.error('Server error:', data);
          // \u5982\u679C\u662F\u767D\u540D\u5355\u9650\u5236\uFF0C\u663E\u793A\u7279\u6B8A\u9519\u8BEF\u9875\u9762
          if (response.status === 403 && data.message.includes('\u767D\u540D\u5355')) {
            this.showWhitelistError(data.message);
            return;
          }
          this.showMessage(data.message || '\u8BC4\u8BBA\u53D1\u5E03\u5931\u8D25', 'error');
        }
      } catch (error) {
        console.error('\u63D0\u4EA4\u8BC4\u8BBA\u5931\u8D25:', error);
        this.showMessage('\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = '\u53D1\u5E03\u8BC4\u8BBA';
      }
    }

    updateCommentsList() {
      const container = document.getElementById('comments-container');
      container.innerHTML = this.comments.length > 0 
        ? this.renderComments(this.comments)
        : '<p style="color: #666; text-align: center; padding: 20px;">\u6682\u65E0\u8BC4\u8BBA\uFF0C\u5FEB\u6765\u53D1\u8868\u7B2C\u4E00\u6761\u8BC4\u8BBA\u5427\uFF01</p>';
    }

    showMessage(message, type) {
      const messageEl = document.getElementById('lzreview-message');
      // \u5B89\u5168\u7684DOM\u64CD\u4F5C\uFF0C\u907F\u514DXSS
      messageEl.innerHTML = '';
      const div = document.createElement('div');
      div.className = \`lzreview-\${type}\`;
      div.textContent = message; // \u4F7F\u7528textContent\u800C\u4E0D\u662FinnerHTML
      messageEl.appendChild(div);
    }

    showWhitelistError(message) {
      // \u5B89\u5168\u7684DOM\u64CD\u4F5C\uFF0C\u907F\u514DXSS
      this.container.innerHTML = '';
      
      const container = document.createElement('div');
      container.className = 'lzreview-container';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'lzreview-error';
      errorDiv.style.cssText = 'text-align: center; padding: 40px; margin: 20px 0;';
      
      const title = document.createElement('h3');
      title.style.cssText = 'color: #721c24; margin-bottom: 15px;';
      title.textContent = '\u8BC4\u8BBA\u7CFB\u7EDF\u8BBF\u95EE\u53D7\u9650';
      
      const messageP = document.createElement('p');
      messageP.style.cssText = 'margin-bottom: 20px; font-size: 16px;';
      messageP.textContent = message;
      
      const helpP = document.createElement('p');
      helpP.style.cssText = 'color: #6c757d; font-size: 14px;';
      helpP.textContent = '\u5982\u9700\u4F7F\u7528\u8BC4\u8BBA\u529F\u80FD\uFF0C\u8BF7\u8054\u7CFB\u7F51\u7AD9\u7BA1\u7406\u5458\u5C06\u5F53\u524D\u57DF\u540D\u6DFB\u52A0\u5230\u767D\u540D\u5355\u4E2D\u3002';
      
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
      // \u6570\u636E\u5E93\u5B58\u50A8\u7684\u5DF2\u7ECF\u662F\u4E2D\u56FD\u65F6\u95F4\uFF0C\u76F4\u63A5\u89E3\u6790\u5373\u53EF
      const date = new Date(dateString.replace(' ', 'T'));
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '\u521A\u521A';
      if (diff < 3600000) return \`\${Math.floor(diff / 60000)}\u5206\u949F\u524D\`;
      if (diff < 86400000) return \`\${Math.floor(diff / 3600000)}\u5C0F\u65F6\u524D\`;
      if (diff < 2592000000) return \`\${Math.floor(diff / 86400000)}\u5929\u524D\`;
      
      return date.toLocaleDateString('zh-CN');
    }

    async submitReply(parentId) {
      const replyContent = document.getElementById(\`reply-content-\${parentId}\`).value.trim();
      const authorName = document.getElementById(\`reply-author-name-\${parentId}\`).value.trim();
      const authorEmail = document.getElementById(\`reply-author-email-\${parentId}\`).value.trim();
      const authorQQ = document.getElementById(\`reply-author-qq-\${parentId}\`).value.trim();
      
      if (!authorName) {
        this.showMessage('\u8BF7\u586B\u5199\u59D3\u540D', 'error');
        return;
      }
      
      if (!replyContent) {
        this.showMessage('\u8BF7\u586B\u5199\u56DE\u590D\u5185\u5BB9', 'error');
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
          this.showMessage('\u56DE\u590D\u53D1\u5E03\u6210\u529F\uFF01', 'success');
          document.getElementById(\`reply-content-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-name-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-email-\${parentId}\`).value = '';
          document.getElementById(\`reply-author-qq-\${parentId}\`).value = '';
          document.getElementById(\`reply-form-\${parentId}\`).style.display = 'none';
          
          // \u91CD\u65B0\u52A0\u8F7D\u8BC4\u8BBA
          await this.loadComments();
          this.updateCommentsList();
        } else {
          // \u5982\u679C\u662F\u767D\u540D\u5355\u9650\u5236\uFF0C\u663E\u793A\u7279\u6B8A\u9519\u8BEF\u9875\u9762
          if (response.status === 403 && data.message.includes('\u767D\u540D\u5355')) {
            this.showWhitelistError(data.message);
            return;
          }
          this.showMessage(data.message || '\u56DE\u590D\u53D1\u5E03\u5931\u8D25', 'error');
        }
      } catch (error) {
        console.error('\u63D0\u4EA4\u56DE\u590D\u5931\u8D25:', error);
        this.showMessage('\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5', 'error');
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

  // \u5168\u5C40\u53D8\u91CF\u5B58\u50A8\u5B9E\u4F8B
  let lzReviewInstance = null;

  // \u5168\u5C40\u51FD\u6570
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

  // \u521D\u59CB\u5316\u8BC4\u8BBA\u7CFB\u7EDF
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      lzReviewInstance = new LzReview(config);
    });
  } else {
    lzReviewInstance = new LzReview(config);
  }
})();
`;
    embed_default = embedScript;
  }
});

// src/web/embed.css
var require_embed = __commonJS({
  "src/web/embed.css"(exports, module) {
    module.exports = {};
  }
});

// src/database/db.js
var DatabaseService = class {
  static {
    __name(this, "DatabaseService");
  }
  constructor(db) {
    this.db = db;
  }
  async getComments(pageUrl, limit = 50, offset = 0) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          id, page_url, author_name, author_email, author_qq, content, created_at, parent_id,
          CASE 
            WHEN author_email IS NOT NULL THEN 1 
            ELSE 0 
          END as has_email
        FROM comments 
        WHERE page_url = ? AND is_approved = 1 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `);
      const result = await stmt.bind(pageUrl, limit, offset).all();
      return result.results || [];
    } catch (error) {
      console.error("Database getComments error:", error);
      return [];
    }
  }
  async addComment(commentData) {
    try {
      const { pageUrl, authorName, authorEmail, authorQQ, content, ipAddress, userAgent, parentId } = commentData;
      if (!pageUrl || !authorName || !content) {
        throw new Error("\u5FC5\u8981\u5B57\u6BB5\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (authorName.length > 50 || content.length > 1e3) {
        throw new Error("\u5B57\u6BB5\u957F\u5EA6\u8D85\u51FA\u9650\u5236");
      }
      if (authorEmail && authorEmail.length > 254) {
        throw new Error("\u90AE\u7BB1\u5730\u5740\u8FC7\u957F");
      }
      if (authorQQ && authorQQ.length > 15) {
        throw new Error("QQ\u53F7\u8FC7\u957F");
      }
      console.log("Attempting to insert comment:", { pageUrl, authorName, content: content.substring(0, 50) + "..." });
      const chinaTime = new Date(Date.now() + 8 * 60 * 60 * 1e3).toISOString().replace("T", " ").replace("Z", "");
      const stmt = this.db.prepare(`
        INSERT INTO comments (page_url, author_name, author_email, author_qq, content, ip_address, user_agent, parent_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = await stmt.bind(
        pageUrl,
        authorName,
        authorEmail || null,
        authorQQ || null,
        content,
        ipAddress,
        userAgent,
        parentId || null,
        chinaTime
      ).run();
      console.log("Insert result - ID:", result.meta.last_row_id);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("Database addComment error:", error.message);
      throw new Error(`\u6570\u636E\u5E93\u9519\u8BEF\uFF1A${error.message}`);
    }
  }
  async deleteComment(commentId, adminToken) {
    if (!this.isValidAdmin(adminToken)) {
      throw new Error("Unauthorized");
    }
    const stmt = this.db.prepare("DELETE FROM comments WHERE id = ?");
    const result = await stmt.bind(commentId).run();
    return result.meta.changes > 0;
  }
  async getCommentCount(pageUrl) {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE page_url = ? AND is_approved = 1
      `);
      const result = await stmt.bind(pageUrl).first();
      return result?.count || 0;
    } catch (error) {
      console.error("Database getCommentCount error:", error);
      return 0;
    }
  }
  isValidAdmin(token) {
    if (!token || typeof token !== "string") {
      return false;
    }
    if (!this.adminToken || typeof this.adminToken !== "string") {
      return false;
    }
    return this.constantTimeCompare(token, this.adminToken);
  }
  // 常量时间比较函数
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  setAdminToken(token) {
    this.adminToken = token;
  }
  // 管理员专用：获取所有评论
  async getAllComments() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          id, page_url, author_name, author_email, author_qq, content, created_at, parent_id,
          CASE 
            WHEN author_email IS NOT NULL THEN 1 
            ELSE 0 
          END as has_email
        FROM comments 
        ORDER BY created_at DESC
      `);
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error("Database getAllComments error:", error);
      return [];
    }
  }
  // 管理员专用：获取统计信息
  async getStats() {
    try {
      const totalStmt = this.db.prepare("SELECT COUNT(*) as total FROM comments");
      const totalResult = await totalStmt.first();
      const todayStmt = this.db.prepare(`
        SELECT COUNT(*) as today 
        FROM comments 
        WHERE DATE(created_at) = DATE('now', '+8 hours')
      `);
      const todayResult = await todayStmt.first();
      const pagesStmt = this.db.prepare("SELECT COUNT(DISTINCT page_url) as pages FROM comments");
      const pagesResult = await pagesStmt.first();
      const whitelistStmt = this.db.prepare("SELECT COUNT(*) as whitelist FROM whitelist");
      const whitelistResult = await whitelistStmt.first();
      return {
        total: totalResult?.total || 0,
        today: todayResult?.today || 0,
        pages: pagesResult?.pages || 0,
        whitelist: whitelistResult?.whitelist || 0
      };
    } catch (error) {
      console.error("Database getStats error:", error);
      return { total: 0, today: 0, pages: 0, whitelist: 0 };
    }
  }
  // 管理员专用：获取页面列表
  async getPages() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          page_url,
          COUNT(*) as comment_count,
          MAX(created_at) as latest_comment
        FROM comments 
        GROUP BY page_url 
        ORDER BY latest_comment DESC
      `);
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error("Database getPages error:", error);
      return [];
    }
  }
  // 管理员专用：批量删除评论
  async batchDeleteComments(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("\u65E0\u6548\u7684ID\u5217\u8868");
      }
      if (ids.length > 100) {
        throw new Error("\u6279\u91CF\u5220\u9664\u6570\u91CF\u8FC7\u591A\uFF0C\u6700\u591A100\u6761");
      }
      const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
      if (validIds.length === 0) {
        throw new Error("\u65E0\u6548\u7684ID\u683C\u5F0F");
      }
      const placeholders = validIds.map(() => "?").join(",");
      const stmt = this.db.prepare(`DELETE FROM comments WHERE id IN (${placeholders})`);
      const result = await stmt.bind(...validIds).run();
      console.log(`\u6279\u91CF\u5220\u9664\u6210\u529F: ${result.meta.changes} \u6761\u8BB0\u5F55`);
      return result.meta.changes || 0;
    } catch (error) {
      console.error("Database batchDeleteComments error:", error);
      throw new Error(`\u6279\u91CF\u5220\u9664\u5931\u8D25\uFF1A${error.message}`);
    }
  }
  // 管理员专用：删除页面所有评论
  async deletePageComments(pageUrl) {
    try {
      const stmt = this.db.prepare("DELETE FROM comments WHERE page_url = ?");
      const result = await stmt.bind(pageUrl).run();
      return result.meta.changes || 0;
    } catch (error) {
      console.error("Database deletePageComments error:", error);
      return 0;
    }
  }
  // 白名单相关方法
  async getWhitelist() {
    try {
      const stmt = this.db.prepare("SELECT * FROM whitelist ORDER BY created_at DESC");
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error("Database getWhitelist error:", error);
      return [];
    }
  }
  async addToWhitelist(domain, description = null) {
    try {
      if (!domain || typeof domain !== "string") {
        throw new Error("\u57DF\u540D\u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (domain.length > 253) {
        throw new Error("\u57DF\u540D\u8FC7\u957F");
      }
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(domain)) {
        throw new Error("\u57DF\u540D\u683C\u5F0F\u4E0D\u6B63\u786E");
      }
      const normalizedDomain = domain.toLowerCase().trim();
      if (description && description.length > 255) {
        throw new Error("\u63CF\u8FF0\u8FC7\u957F");
      }
      const stmt = this.db.prepare("INSERT INTO whitelist (domain, description) VALUES (?, ?)");
      const result = await stmt.bind(normalizedDomain, description).run();
      console.log(`\u6DFB\u52A0\u767D\u540D\u5355\u6210\u529F: ${normalizedDomain}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("Database addToWhitelist error:", error);
      throw new Error(`\u6DFB\u52A0\u767D\u540D\u5355\u5931\u8D25\uFF1A${error.message}`);
    }
  }
  async removeFromWhitelist(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM whitelist WHERE id = ?");
      const result = await stmt.bind(id).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error("Database removeFromWhitelist error:", error);
      return false;
    }
  }
  async isWhitelisted(domain) {
    try {
      if (!domain || typeof domain !== "string") {
        return false;
      }
      const normalizedDomain = domain.toLowerCase().trim();
      const stmt = this.db.prepare("SELECT COUNT(*) as count FROM whitelist WHERE domain = ?");
      const result = await stmt.bind(normalizedDomain).first();
      return result?.count > 0;
    } catch (error) {
      console.error("Database isWhitelisted error:", error);
      return false;
    }
  }
  // 速率限制相关方法
  async checkRateLimit(ipHash, maxRequests = 10, windowMinutes = 1) {
    try {
      await this.cleanOldRateLimits(windowMinutes);
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1e3).toISOString();
      const stmt = this.db.prepare(`
        SELECT request_count 
        FROM rate_limits 
        WHERE ip_hash = ? AND window_start > ?
      `);
      const result = await stmt.bind(ipHash, windowStart).first();
      if (!result) {
        await this.createRateLimit(ipHash);
        return true;
      }
      if (result.request_count >= maxRequests) {
        return false;
      }
      await this.updateRateLimit(ipHash);
      return true;
    } catch (error) {
      console.error("Database checkRateLimit error:", error);
      return true;
    }
  }
  async createRateLimit(ipHash) {
    const stmt = this.db.prepare(`
      INSERT INTO rate_limits (ip_hash, request_count, window_start, updated_at) 
      VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    await stmt.bind(ipHash).run();
  }
  async updateRateLimit(ipHash) {
    const stmt = this.db.prepare(`
      UPDATE rate_limits 
      SET request_count = request_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE ip_hash = ?
    `);
    await stmt.bind(ipHash).run();
  }
  async cleanOldRateLimits(windowMinutes = 1) {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1e3).toISOString();
    const stmt = this.db.prepare("DELETE FROM rate_limits WHERE window_start < ?");
    await stmt.bind(cutoff).run();
  }
  // 通知配置相关方法
  async getNotificationConfig() {
    try {
      const stmt = this.db.prepare("SELECT config_data FROM notification_config WHERE id = 1");
      const result = await stmt.first();
      if (result?.config_data) {
        return JSON.parse(result.config_data);
      }
      return {
        email: {
          enabled: false,
          recipients: [],
          subscribers: [],
          includePageInfo: true,
          includeCommentContent: true,
          template: "default"
        },
        telegram: {
          enabled: false,
          chatIds: [],
          includePageInfo: true,
          includeCommentContent: true,
          template: "default"
        },
        webhook: {
          enabled: false,
          url: "",
          method: "POST",
          headers: {},
          template: "default"
        }
      };
    } catch (error) {
      console.error("Database getNotificationConfig error:", error);
      return {
        email: {
          enabled: false,
          recipients: [],
          subscribers: [],
          includePageInfo: true,
          includeCommentContent: true,
          template: "default"
        },
        telegram: {
          enabled: false,
          chatIds: [],
          includePageInfo: true,
          includeCommentContent: true,
          template: "default"
        },
        webhook: {
          enabled: false,
          url: "",
          method: "POST",
          headers: {},
          template: "default"
        }
      };
    }
  }
  async saveNotificationConfig(config) {
    try {
      const configData = JSON.stringify(config);
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO notification_config (id, config_data, updated_at) 
        VALUES (1, ?, CURRENT_TIMESTAMP)
      `);
      await stmt.bind(configData).run();
      console.log("\u901A\u77E5\u914D\u7F6E\u4FDD\u5B58\u6210\u529F");
    } catch (error) {
      console.error("Database saveNotificationConfig error:", error);
      throw new Error(`\u4FDD\u5B58\u901A\u77E5\u914D\u7F6E\u5931\u8D25\uFF1A${error.message}`);
    }
  }
  // 邮件订阅相关方法
  async getEmailSubscribers() {
    try {
      const stmt = this.db.prepare(`
        SELECT id, email, name, page_url, subscribed_at, is_active 
        FROM email_subscribers 
        WHERE is_active = 1 
        ORDER BY subscribed_at DESC
      `);
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error("Database getEmailSubscribers error:", error);
      return [];
    }
  }
  async getEmailSubscriber(email) {
    try {
      const stmt = this.db.prepare("SELECT * FROM email_subscribers WHERE email = ?");
      const result = await stmt.bind(email).first();
      return result;
    } catch (error) {
      console.error("Database getEmailSubscriber error:", error);
      return null;
    }
  }
  async addEmailSubscriber(subscriberData) {
    try {
      const { email, name, pageUrl, subscribedAt, isActive } = subscriberData;
      if (!email || typeof email !== "string") {
        throw new Error("\u90AE\u7BB1\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E");
      }
      if (email.length > 254) {
        throw new Error("\u90AE\u7BB1\u5730\u5740\u8FC7\u957F");
      }
      if (name && name.length > 100) {
        throw new Error("\u540D\u79F0\u8FC7\u957F");
      }
      const stmt = this.db.prepare(`
        INSERT INTO email_subscribers (email, name, page_url, subscribed_at, is_active) 
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = await stmt.bind(
        email.toLowerCase().trim(),
        name || email.split("@")[0],
        pageUrl || null,
        subscribedAt || (/* @__PURE__ */ new Date()).toISOString(),
        isActive !== false ? 1 : 0
      ).run();
      console.log(`\u90AE\u4EF6\u8BA2\u9605\u6DFB\u52A0\u6210\u529F: ${email}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("Database addEmailSubscriber error:", error);
      throw new Error(`\u6DFB\u52A0\u90AE\u4EF6\u8BA2\u9605\u5931\u8D25\uFF1A${error.message}`);
    }
  }
  async removeEmailSubscriberByEmail(email) {
    try {
      const stmt = this.db.prepare("DELETE FROM email_subscribers WHERE email = ?");
      const result = await stmt.bind(email.toLowerCase().trim()).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error("Database removeEmailSubscriberByEmail error:", error);
      return false;
    }
  }
  async removeEmailSubscriberById(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM email_subscribers WHERE id = ?");
      const result = await stmt.bind(id).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error("Database removeEmailSubscriberById error:", error);
      return false;
    }
  }
  // 获取单个评论详情
  async getCommentById(commentId) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          id, page_url, author_name, author_email, author_qq, content, created_at, parent_id
        FROM comments 
        WHERE id = ?
      `);
      const result = await stmt.bind(commentId).first();
      return result;
    } catch (error) {
      console.error("Database getCommentById error:", error);
      return null;
    }
  }
  // Telegram 订阅者相关方法
  async getTelegramSubscribers() {
    try {
      const stmt = this.db.prepare(`
        SELECT chat_id, name, chat_type, page_url, subscribed_at, is_active
        FROM telegram_subscribers 
        WHERE is_active = 1
        ORDER BY subscribed_at DESC
      `);
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error("Database getTelegramSubscribers error:", error);
      return [];
    }
  }
  async getTelegramSubscriber(chatId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM telegram_subscribers WHERE chat_id = ?
      `);
      const result = await stmt.bind(chatId.toString()).first();
      return result;
    } catch (error) {
      console.error("Database getTelegramSubscriber error:", error);
      return null;
    }
  }
  async addTelegramSubscriber({ chatId, name, chatType, pageUrl, subscribedAt, isActive }) {
    try {
      if (!chatId || typeof chatId !== "string" && typeof chatId !== "number") {
        throw new Error("Chat ID \u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (name && name.length > 100) {
        throw new Error("\u540D\u79F0\u8FC7\u957F");
      }
      const stmt = this.db.prepare(`
        INSERT INTO telegram_subscribers (chat_id, name, chat_type, page_url, subscribed_at, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = await stmt.bind(
        chatId.toString(),
        name || `Chat ${chatId}`,
        chatType || "private",
        pageUrl || null,
        subscribedAt || (/* @__PURE__ */ new Date()).toISOString(),
        isActive !== false ? 1 : 0
      ).run();
      console.log(`Telegram \u8BA2\u9605\u6DFB\u52A0\u6210\u529F: ${chatId}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("Database addTelegramSubscriber error:", error);
      throw new Error(`\u6DFB\u52A0 Telegram \u8BA2\u9605\u5931\u8D25\uFF1A${error.message}`);
    }
  }
  async removeTelegramSubscriberByChatId(chatId) {
    try {
      const stmt = this.db.prepare("DELETE FROM telegram_subscribers WHERE chat_id = ?");
      const result = await stmt.bind(chatId.toString()).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error("Database removeTelegramSubscriberByChatId error:", error);
      return false;
    }
  }
  async removeTelegramSubscriberById(id) {
    try {
      const stmt = this.db.prepare("DELETE FROM telegram_subscribers WHERE id = ?");
      const result = await stmt.bind(id).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error("Database removeTelegramSubscriberById error:", error);
      return false;
    }
  }
};

// src/utils/validation.js
function validateComment(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    errors.push("\u65E0\u6548\u7684\u8BF7\u6C42\u6570\u636E");
    return { isValid: false, errors };
  }
  if (!data.pageUrl || typeof data.pageUrl !== "string") {
    errors.push("\u9875\u9762URL\u4E0D\u80FD\u4E3A\u7A7A");
  } else if (!isValidUrl(data.pageUrl)) {
    errors.push("\u9875\u9762URL\u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  if (!data.authorName || typeof data.authorName !== "string" || data.authorName.trim().length === 0) {
    errors.push("\u7528\u6237\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  } else if (data.authorName.length > 50) {
    errors.push("\u7528\u6237\u540D\u4E0D\u80FD\u8D85\u8FC750\u4E2A\u5B57\u7B26");
  } else if (containsControlCharacters(data.authorName)) {
    errors.push("\u7528\u6237\u540D\u5305\u542B\u975E\u6CD5\u5B57\u7B26");
  }
  if (!data.content || typeof data.content !== "string" || data.content.trim().length === 0) {
    errors.push("\u8BC4\u8BBA\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  } else if (data.content.length > 1e3) {
    errors.push("\u8BC4\u8BBA\u5185\u5BB9\u4E0D\u80FD\u8D85\u8FC71000\u4E2A\u5B57\u7B26");
  } else if (containsControlCharacters(data.content)) {
    errors.push("\u8BC4\u8BBA\u5185\u5BB9\u5305\u542B\u975E\u6CD5\u5B57\u7B26");
  }
  if (data.authorEmail && !isValidEmail(data.authorEmail)) {
    errors.push("\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  if (data.authorQQ && !isValidQQ(data.authorQQ)) {
    errors.push("QQ\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  if (data.parentId && (!Number.isInteger(data.parentId) || data.parentId <= 0)) {
    errors.push("\u7236\u8BC4\u8BBAID\u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
__name(validateComment, "validateComment");
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function isValidQQ(qq) {
  if (typeof qq !== "string" || qq.length === 0) {
    return false;
  }
  const qqRegex = /^[1-9][0-9]{4,10}$/;
  return qqRegex.test(qq);
}
__name(isValidQQ, "isValidQQ");
function containsControlCharacters(str) {
  if (typeof str !== "string") return false;
  const dangerousChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF]/;
  return dangerousChars.test(str);
}
__name(containsControlCharacters, "containsControlCharacters");
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;").replace(/\n/g, "&#x0A;").replace(/\r/g, "&#x0D;").replace(/\t/g, "&#x09;");
}
__name(sanitizeInput, "sanitizeInput");
function isValidUrl(url) {
  try {
    if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
      return false;
    }
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }
    if (!urlObj.hostname || urlObj.hostname.length > 253) {
      return false;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(urlObj.hostname)) {
      const parts = urlObj.hostname.split(".");
      if (parts.some((part) => parseInt(part) > 255)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
__name(isValidUrl, "isValidUrl");

// src/utils/security.js
function getClientIP(request) {
  const cfConnectingIP = request.headers.get("CF-Connecting-IP");
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  const xRealIP = request.headers.get("X-Real-IP");
  return cfConnectingIP || xForwardedFor?.split(",")[0] || xRealIP || "unknown";
}
__name(getClientIP, "getClientIP");
function getUserAgent(request) {
  return request.headers.get("User-Agent") || "unknown";
}
__name(getUserAgent, "getUserAgent");
function rateLimitCheck(ip, cache2) {
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowMs = 6e4;
  const maxRequests = 10;
  const requests = cache2.get(key) || [];
  const validRequests = requests.filter((time) => now - time < windowMs);
  if (validRequests.length >= maxRequests) {
    return false;
  }
  validRequests.push(now);
  cache2.set(key, validRequests);
  if (validRequests.length > maxRequests * 2) {
    cache2.set(key, validRequests.slice(-maxRequests));
  }
  return true;
}
__name(rateLimitCheck, "rateLimitCheck");
function containsBadWords(text) {
  if (typeof text !== "string") return false;
  const badWords = [
    "\u5783\u573E",
    "\u5E7F\u544A",
    "spam",
    "\u8272\u60C5",
    "\u8D4C\u535A",
    "\u6BD2\u54C1",
    "\u66B4\u529B",
    "\u6050\u6016",
    "\u53CD\u52A8",
    "\u5206\u88C2",
    "\u90AA\u6559",
    "fuck",
    "shit",
    "bitch",
    "porn",
    "sex"
    // 可以根据需要添加更多敏感词
  ];
  const lowerText = text.toLowerCase();
  return badWords.some((word) => {
    if (lowerText.includes(word)) return true;
    const variations = generateWordVariations(word);
    return variations.some((variant) => lowerText.includes(variant));
  });
}
__name(containsBadWords, "containsBadWords");
function generateWordVariations(word) {
  const variations = [word];
  const replacements = {
    "a": ["@", "4"],
    "e": ["3"],
    "i": ["1", "!"],
    "o": ["0"],
    "s": ["$", "5"],
    "t": ["7"]
  };
  let current = word;
  for (const [letter, nums] of Object.entries(replacements)) {
    for (const num of nums) {
      variations.push(current.replace(new RegExp(letter, "g"), num));
    }
  }
  return variations;
}
__name(generateWordVariations, "generateWordVariations");
function generateSecureToken(length = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
__name(generateSecureToken, "generateSecureToken");
function generateCSRFToken() {
  return generateSecureToken(32);
}
__name(generateCSRFToken, "generateCSRFToken");
async function hashIP(ip) {
  if (!ip || typeof ip !== "string") {
    return "unknown";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "salt_for_privacy");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashIP, "hashIP");
function sanitizeErrorMessage(error) {
  if (!error) return "\u672A\u77E5\u9519\u8BEF";
  const message = error.message || error.toString();
  const sensitivePatterns = [
    /table.*not found/i,
    /column.*not found/i,
    /database.*error/i,
    /sql.*error/i,
    /connection.*failed/i,
    /permission.*denied/i,
    /access.*denied/i,
    /file.*not found/i,
    /directory.*not found/i,
    /network.*error/i
  ];
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return "\u7CFB\u7EDF\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
    }
  }
  return message;
}
__name(sanitizeErrorMessage, "sanitizeErrorMessage");

// src/utils/response.js
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({
    error: true,
    message
  }, status);
}
__name(errorResponse, "errorResponse");
function successResponse(data, message = "Success") {
  return jsonResponse({
    success: true,
    message,
    data
  });
}
__name(successResponse, "successResponse");
function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(corsResponse, "corsResponse");
function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
__name(htmlResponse, "htmlResponse");

// src/notifiers/email.js
var EmailNotifier = class {
  static {
    __name(this, "EmailNotifier");
  }
  constructor(config) {
    this.config = {
      apiKey: config.apiKey,
      fromName: config.fromName || "lzreview\u8BC4\u8BBA\u7CFB\u7EDF",
      fromEmail: config.fromEmail || "notifications@example.com",
      apiUrl: "https://api.resend.com/emails"
    };
  }
  /**
   * 发送新评论通知邮件
   */
  async sendNewCommentNotification(commentData, emailConfig) {
    console.log("\u{1F4EE} EmailNotifier: \u5F00\u59CB\u53D1\u9001\u65B0\u8BC4\u8BBA\u901A\u77E5\u90AE\u4EF6");
    console.log("\u{1F4EE} \u90AE\u4EF6\u914D\u7F6E:", emailConfig);
    console.log("\u{1F4EE} API Key \u914D\u7F6E:", this.config.apiKey ? "\u2705 \u5DF2\u914D\u7F6E" : "\u274C \u672A\u914D\u7F6E");
    try {
      const allRecipients = [
        ...emailConfig.recipients || [],
        ...emailConfig.subscribers || []
      ];
      console.log("\u{1F4EE} \u6536\u4EF6\u4EBA\u5217\u8868:", allRecipients);
      if (allRecipients.length === 0) {
        console.log("\u274C \u6CA1\u6709\u914D\u7F6E\u6536\u4EF6\u4EBA");
        return {
          success: false,
          message: "\u6CA1\u6709\u914D\u7F6E\u6536\u4EF6\u4EBA"
        };
      }
      console.log("\u{1F4EE} \u751F\u6210\u90AE\u4EF6\u5185\u5BB9...");
      const emailContent = this.generateEmailContent(commentData, emailConfig);
      console.log("\u{1F4EE} \u90AE\u4EF6\u4E3B\u9898:", emailContent.subject);
      const results = [];
      console.log("\u{1F4EE} \u5F00\u59CB\u9010\u4E2A\u53D1\u9001\u90AE\u4EF6...");
      for (const recipient of allRecipients) {
        try {
          console.log(`\u{1F4EE} \u53D1\u9001\u90AE\u4EF6\u5230: ${recipient}`);
          const result = await this.sendEmail(recipient, emailContent);
          console.log(`\u{1F4EE} \u53D1\u9001\u7ED3\u679C [${recipient}]:`, result);
          results.push({
            recipient,
            success: result.success,
            message: result.message
          });
        } catch (error) {
          console.log(`\u274C \u53D1\u9001\u5931\u8D25 [${recipient}]:`, error.message);
          results.push({
            recipient,
            success: false,
            message: error.message
          });
        }
      }
      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;
      return {
        success: successCount > 0,
        message: `\u90AE\u4EF6\u53D1\u9001\u5B8C\u6210: ${successCount}/${totalCount} \u6210\u529F`,
        details: results
      };
    } catch (error) {
      console.error("\u90AE\u4EF6\u901A\u77E5\u53D1\u9001\u5931\u8D25:", error);
      return {
        success: false,
        message: `\u90AE\u4EF6\u53D1\u9001\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 生成邮件内容
   */
  generateEmailContent(commentData, emailConfig) {
    const isReply = commentData.isReply;
    const subject = isReply ? `\u65B0\u56DE\u590D\u901A\u77E5 - ${commentData.pageTitle}` : `\u65B0\u8BC4\u8BBA\u901A\u77E5 - ${commentData.pageTitle}`;
    const htmlContent = this.generateHTMLTemplate(commentData, emailConfig);
    const textContent = this.generateTextTemplate(commentData, emailConfig);
    return {
      subject,
      html: htmlContent,
      text: textContent
    };
  }
  /**
   * 生成HTML邮件模板
   */
  generateHTMLTemplate(commentData, emailConfig) {
    const isReply = commentData.isReply;
    const actionText = isReply ? "\u56DE\u590D\u4E86\u8BC4\u8BBA" : "\u53D1\u8868\u4E86\u65B0\u8BC4\u8BBA";
    const typeText = isReply ? "\u56DE\u590D" : "\u8BC4\u8BBA";
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${typeText}\u901A\u77E5</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007cba;
        }
        .header h1 {
            color: #007cba;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .notification-type {
            background: ${isReply ? "#28a745" : "#007cba"};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        .page-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #007cba;
        }
        .page-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .page-url {
            color: #666;
            font-size: 14px;
            word-break: break-all;
        }
        .comment-info {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .author-info {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .author-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #007cba;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 12px;
        }
        .author-details h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
        }
        .author-details p {
            margin: 2px 0 0 0;
            font-size: 14px;
            color: #666;
        }
        .comment-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid ${isReply ? "#28a745" : "#007cba"};
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
        }
        .actions {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #007cba;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 0 10px;
        }
        .btn:hover {
            background: #005a87;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #545b62;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        .timestamp {
            color: #999;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>\u{1F4E7} lzreview</h1>
            <p>\u8BC4\u8BBA\u7CFB\u7EDF\u901A\u77E5</p>
        </div>

        <div class="notification-type">
            ${isReply ? "\u{1F4AC} \u65B0\u56DE\u590D" : "\u{1F514} \u65B0\u8BC4\u8BBA"}
        </div>

        ${emailConfig.includePageInfo !== false ? `
        <div class="page-info">
            <div class="page-title">\u{1F4C4} ${commentData.pageTitle}</div>
            <div class="page-url">${commentData.pageUrl}</div>
        </div>
        ` : ""}

        <div class="comment-info">
            <div class="author-info">
                <div class="author-avatar">
                    ${commentData.authorName.charAt(0).toUpperCase()}
                </div>
                <div class="author-details">
                    <h3>${commentData.authorName}</h3>
                    <p>${actionText} \u2022 <span class="timestamp">${this.formatDate(commentData.createdAt)}</span></p>
                </div>
            </div>

            ${emailConfig.includeCommentContent !== false ? `
            <div class="comment-content">${commentData.content}</div>
            ` : `
            <p style="color: #666; font-style: italic;">\u5185\u5BB9\u5DF2\u9690\u85CF\uFF0C\u8BF7\u524D\u5F80\u9875\u9762\u67E5\u770B\u5B8C\u6574${typeText}</p>
            `}
        </div>

        <div class="actions">
            <a href="${commentData.pageUrl}#comment-${commentData.id}" class="btn">
                \u67E5\u770B${typeText}
            </a>
            <a href="${commentData.pageUrl}" class="btn btn-secondary">
                \u8BBF\u95EE\u9875\u9762
            </a>
        </div>

        <div class="footer">
            <p>\u8FD9\u662F\u6765\u81EA lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u7684\u81EA\u52A8\u901A\u77E5</p>
            <p>\u5982\u4E0D\u60F3\u63A5\u6536\u6B64\u7C7B\u90AE\u4EF6\uFF0C\u8BF7\u8054\u7CFB\u7F51\u7AD9\u7BA1\u7406\u5458</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                \u90AE\u4EF6\u53D1\u9001\u65F6\u95F4: ${this.formatDate(/* @__PURE__ */ new Date())}
            </p>
        </div>
    </div>
</body>
</html>`;
  }
  /**
   * 生成纯文本邮件模板
   */
  generateTextTemplate(commentData, emailConfig) {
    const isReply = commentData.isReply;
    const actionText = isReply ? "\u56DE\u590D\u4E86\u8BC4\u8BBA" : "\u53D1\u8868\u4E86\u65B0\u8BC4\u8BBA";
    const typeText = isReply ? "\u56DE\u590D" : "\u8BC4\u8BBA";
    let content = `
lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u901A\u77E5

${isReply ? "\u{1F4AC} \u65B0\u56DE\u590D" : "\u{1F514} \u65B0\u8BC4\u8BBA"}

`;
    if (emailConfig.includePageInfo !== false) {
      content += `\u9875\u9762: ${commentData.pageTitle}
URL: ${commentData.pageUrl}

`;
    }
    content += `${commentData.authorName} ${actionText}
\u65F6\u95F4: ${this.formatDate(commentData.createdAt)}

`;
    if (emailConfig.includeCommentContent !== false) {
      content += `${typeText}\u5185\u5BB9:
${commentData.content}

`;
    } else {
      content += `\u5185\u5BB9\u5DF2\u9690\u85CF\uFF0C\u8BF7\u524D\u5F80\u9875\u9762\u67E5\u770B\u5B8C\u6574${typeText}

`;
    }
    content += `\u67E5\u770B${typeText}: ${commentData.pageUrl}#comment-${commentData.id}
\u8BBF\u95EE\u9875\u9762: ${commentData.pageUrl}

---
\u8FD9\u662F\u6765\u81EA lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u7684\u81EA\u52A8\u901A\u77E5
\u5982\u4E0D\u60F3\u63A5\u6536\u6B64\u7C7B\u90AE\u4EF6\uFF0C\u8BF7\u8054\u7CFB\u7F51\u7AD9\u7BA1\u7406\u5458

\u90AE\u4EF6\u53D1\u9001\u65F6\u95F4: ${this.formatDate(/* @__PURE__ */ new Date())}
    `;
    return content.trim();
  }
  /**
   * 发送邮件 (使用 Resend API)
   */
  async sendEmail(recipient, content) {
    console.log(`\u{1F4EE} sendEmail \u5F00\u59CB - \u6536\u4EF6\u4EBA: ${recipient}`);
    try {
      if (!this.config.apiKey) {
        throw new Error("Resend API Key \u672A\u914D\u7F6E");
      }
      const emailData = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [recipient],
        subject: content.subject,
        html: content.html,
        text: content.text
      };
      console.log(`\u{1F4EE} \u51C6\u5907\u53D1\u9001\u90AE\u4EF6\u6570\u636E:`, {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        apiUrl: this.config.apiUrl
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`\u{1F4EE} \u8BF7\u6C42\u8D85\u65F6\uFF0C\u6B63\u5728\u4E2D\u6B62\u8BF7\u6C42...`);
        controller.abort();
      }, 3e4);
      console.log(`\u{1F4EE} \u5F00\u59CB\u53D1\u9001 HTTP \u8BF7\u6C42\u5230 Resend API...`);
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log(`\u{1F4EE} HTTP \u54CD\u5E94\u72B6\u6001: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(`\u{1F4EE} API \u9519\u8BEF\u54CD\u5E94:`, errorData);
        throw new Error(`Resend API \u9519\u8BEF: ${response.status} - ${errorData.message || response.statusText}`);
      }
      console.log(`\u{1F4EE} \u5F00\u59CB\u89E3\u6790\u54CD\u5E94 JSON...`);
      const result = await response.json();
      console.log(`\u{1F4EE} API \u54CD\u5E94\u7ED3\u679C:`, result);
      console.log(`\u{1F4EE} \u90AE\u4EF6\u53D1\u9001\u6210\u529F - Message ID: ${result.id}`);
      return {
        success: true,
        message: "\u90AE\u4EF6\u53D1\u9001\u6210\u529F",
        messageId: result.id
      };
    } catch (error) {
      console.error("\u{1F4EE} \u90AE\u4EF6\u53D1\u9001\u5931\u8D25:", error);
      let errorMessage = error.message;
      if (error.name === "AbortError") {
        errorMessage = "\u8BF7\u6C42\u8D85\u65F6 - Resend API \u54CD\u5E94\u65F6\u95F4\u8FC7\u957F";
      } else if (error.message.includes("fetch")) {
        errorMessage = "\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25 - \u65E0\u6CD5\u8FDE\u63A5\u5230 Resend API";
      }
      console.log(`\u{1F4EE} \u9519\u8BEF\u7C7B\u578B: ${error.name}, \u9519\u8BEF\u6D88\u606F: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
  /**
   * 测试邮件发送功能
   */
  async test(testConfig = {}) {
    try {
      const testEmail = testConfig.testEmail || this.config.fromEmail;
      const testContent = {
        subject: "\u{1F9EA} lzreview \u90AE\u4EF6\u63A8\u9001\u6D4B\u8BD5",
        html: this.generateTestEmailHTML(),
        text: this.generateTestEmailText()
      };
      const result = await this.sendEmail(testEmail, testContent);
      return {
        success: result.success,
        message: result.success ? `\u6D4B\u8BD5\u90AE\u4EF6\u5DF2\u53D1\u9001\u5230 ${testEmail}` : `\u6D4B\u8BD5\u90AE\u4EF6\u53D1\u9001\u5931\u8D25: ${result.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: `\u90AE\u4EF6\u63A8\u9001\u6D4B\u8BD5\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 生成测试邮件HTML内容
   */
  generateTestEmailHTML() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>\u90AE\u4EF6\u63A8\u9001\u6D4B\u8BD5</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .test-header { background: #007cba; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .test-content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>\u{1F9EA} lzreview \u90AE\u4EF6\u63A8\u9001\u6D4B\u8BD5</h1>
        <p>\u5982\u679C\u60A8\u6536\u5230\u8FD9\u5C01\u90AE\u4EF6\uFF0C\u8BF4\u660E\u90AE\u4EF6\u63A8\u9001\u529F\u80FD\u6B63\u5E38\u5DE5\u4F5C</p>
    </div>
    
    <div class="test-content">
        <p><span class="success-badge">\u2705 \u6D4B\u8BD5\u6210\u529F</span></p>
        <p><strong>\u6D4B\u8BD5\u65F6\u95F4:</strong> ${this.formatDate(/* @__PURE__ */ new Date())}</p>
        <p><strong>\u53D1\u9001\u65B9:</strong> ${this.config.fromName} &lt;${this.config.fromEmail}&gt;</p>
        <p><strong>\u90AE\u4EF6\u670D\u52A1:</strong> Resend API</p>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center;">
        \u8FD9\u662F\u6765\u81EA lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u7684\u6D4B\u8BD5\u90AE\u4EF6
    </p>
</body>
</html>`;
  }
  /**
   * 生成测试邮件文本内容
   */
  generateTestEmailText() {
    return `
lzreview \u90AE\u4EF6\u63A8\u9001\u6D4B\u8BD5

\u2705 \u5982\u679C\u60A8\u6536\u5230\u8FD9\u5C01\u90AE\u4EF6\uFF0C\u8BF4\u660E\u90AE\u4EF6\u63A8\u9001\u529F\u80FD\u6B63\u5E38\u5DE5\u4F5C

\u6D4B\u8BD5\u4FE1\u606F:
- \u6D4B\u8BD5\u65F6\u95F4: ${this.formatDate(/* @__PURE__ */ new Date())}
- \u53D1\u9001\u65B9: ${this.config.fromName} <${this.config.fromEmail}>
- \u90AE\u4EF6\u670D\u52A1: Resend API

\u8FD9\u662F\u6765\u81EA lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u7684\u6D4B\u8BD5\u90AE\u4EF6
    `;
  }
  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }
};

// src/notifiers/telegram.js
var TelegramNotifier = class {
  static {
    __name(this, "TelegramNotifier");
  }
  constructor(config) {
    console.log("\u{1F4F1} \u521D\u59CB\u5316 TelegramNotifier\uFF0C\u914D\u7F6E:", {
      hasBotToken: !!config.botToken,
      parseMode: "\u7EAF\u6587\u672C\u6A21\u5F0F"
    });
    this.config = {
      botToken: config.botToken,
      apiUrl: config.botToken ? `https://api.telegram.org/bot${config.botToken}` : null,
      parseMode: config.parseMode || "Markdown"
    };
    if (!this.config.botToken) {
      console.log("\u26A0\uFE0F Telegram Bot Token \u672A\u914D\u7F6E\uFF0C\u901A\u77E5\u529F\u80FD\u5C06\u4E0D\u53EF\u7528");
    } else {
      console.log("\u2705 Telegram Bot Token \u5DF2\u914D\u7F6E\uFF0CAPI URL:", this.config.apiUrl);
    }
  }
  /**
   * 发送新评论通知到 Telegram
   */
  async sendNewCommentNotification(commentData, telegramConfig) {
    console.log("\u{1F4F1} TelegramNotifier: \u5F00\u59CB\u53D1\u9001\u65B0\u8BC4\u8BBA\u901A\u77E5");
    console.log("\u{1F4F1} Telegram\u914D\u7F6E:", telegramConfig);
    console.log("\u{1F4F1} Bot Token \u914D\u7F6E:", this.config.botToken ? "\u2705 \u5DF2\u914D\u7F6E" : "\u274C \u672A\u914D\u7F6E");
    try {
      const chatIds = telegramConfig.chatIds || [];
      console.log("\u{1F4F1} \u63A5\u6536\u8005Chat ID\u5217\u8868:", chatIds);
      if (chatIds.length === 0) {
        console.log("\u274C \u6CA1\u6709\u914D\u7F6E\u63A5\u6536\u8005Chat ID");
        return {
          success: false,
          message: "\u6CA1\u6709\u914D\u7F6E\u63A5\u6536\u8005Chat ID"
        };
      }
      console.log("\u{1F4F1} \u751F\u6210\u6D88\u606F\u5185\u5BB9...");
      const messageContent = this.generateMessageContent(commentData, telegramConfig);
      console.log("\u{1F4F1} \u6D88\u606F\u5185\u5BB9\u957F\u5EA6:", messageContent.length);
      const results = [];
      console.log("\u{1F4F1} \u5F00\u59CB\u9010\u4E2A\u53D1\u9001\u6D88\u606F...");
      for (const chatId of chatIds) {
        try {
          console.log(`\u{1F4F1} \u53D1\u9001\u6D88\u606F\u5230Chat ID: ${chatId}`);
          const result = await this.sendMessage(chatId, messageContent);
          console.log(`\u{1F4F1} \u53D1\u9001\u7ED3\u679C [${chatId}]:`, result);
          results.push({
            chatId,
            success: result.success,
            message: result.message
          });
        } catch (error) {
          console.log(`\u274C \u53D1\u9001\u5931\u8D25 [${chatId}]:`, error.message);
          results.push({
            chatId,
            success: false,
            message: error.message
          });
        }
      }
      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;
      return {
        success: successCount > 0,
        message: `Telegram\u6D88\u606F\u53D1\u9001\u5B8C\u6210: ${successCount}/${totalCount} \u6210\u529F`,
        details: results
      };
    } catch (error) {
      console.error("Telegram\u901A\u77E5\u53D1\u9001\u5931\u8D25:", error);
      return {
        success: false,
        message: `Telegram\u53D1\u9001\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 生成Telegram消息内容
   */
  generateMessageContent(commentData, telegramConfig) {
    const isReply = commentData.isReply;
    const actionText = isReply ? "\u56DE\u590D\u4E86\u8BC4\u8BBA" : "\u53D1\u8868\u4E86\u65B0\u8BC4\u8BBA";
    const typeText = isReply ? "\u56DE\u590D" : "\u8BC4\u8BBA";
    const emoji = isReply ? "\u{1F4AC}" : "\u{1F514}";
    let message = `${emoji} \u65B0${typeText}\u901A\u77E5

`;
    if (telegramConfig.includePageInfo !== false) {
      message += `\u{1F4C4} \u9875\u9762: ${commentData.pageTitle}
`;
      message += `\u{1F517} \u94FE\u63A5: ${commentData.pageUrl}

`;
    }
    message += `\u{1F464} \u4F5C\u8005: ${commentData.authorName}
`;
    message += `\u23F0 \u65F6\u95F4: ${this.formatDate(commentData.createdAt)}

`;
    if (telegramConfig.includeCommentContent !== false) {
      const content = this.truncateText(commentData.content, 500);
      message += `\u{1F4AD} ${typeText}\u5185\u5BB9:
`;
      message += `${content}

`;
    } else {
      message += `\u{1F4AD} \u5185\u5BB9\u5DF2\u9690\u85CF\uFF0C\u8BF7\u524D\u5F80\u9875\u9762\u67E5\u770B\u5B8C\u6574${typeText}

`;
    }
    message += `\u{1F517} \u67E5\u770B${typeText}: ${commentData.pageUrl}#comment-${commentData.id}
`;
    message += `\u{1F4D6} \u8BBF\u95EE\u9875\u9762: ${commentData.pageUrl}`;
    return message;
  }
  /**
   * 发送消息到指定的 Chat ID (带重试机制)
   */
  async sendMessage(chatId, message) {
    console.log(`\u{1F4F1} sendMessage \u5F00\u59CB - Chat ID: ${chatId}`);
    const maxRetries = 3;
    const baseDelay = 1e3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\u{1F4F1} \u5C1D\u8BD5\u7B2C ${attempt}/${maxRetries} \u6B21\u53D1\u9001\u6D88\u606F`);
      try {
        const result = await this.sendMessageAttempt(chatId, message, attempt);
        console.log(`\u{1F4F1} \u7B2C ${attempt} \u6B21\u5C1D\u8BD5\u6210\u529F`);
        return result;
      } catch (error) {
        console.log(`\u{1F4F1} \u7B2C ${attempt} \u6B21\u5C1D\u8BD5\u5931\u8D25:`, error.message);
        if (attempt === maxRetries || this.isNonRetryableError(error)) {
          console.log(`\u{1F4F1} \u4E0D\u518D\u91CD\u8BD5: ${attempt === maxRetries ? "\u8FBE\u5230\u6700\u5927\u91CD\u8BD5\u6B21\u6570" : "\u4E0D\u53EF\u91CD\u8BD5\u7684\u9519\u8BEF"}`);
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`\u{1F4F1} \u7B49\u5F85 ${delay}ms \u540E\u91CD\u8BD5...`);
        await this.sleep(delay);
      }
    }
  }
  /**
   * 判断是否为不可重试的错误
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      "Unauthorized",
      "401",
      "bot was blocked",
      "chat not found",
      "Bad Request"
    ];
    return nonRetryableErrors.some(
      (errorType) => error.message.includes(errorType)
    );
  }
  /**
   * 睡眠函数
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * 单次发送消息尝试
   */
  async sendMessageAttempt(chatId, message, attempt) {
    try {
      if (!this.config.botToken) {
        throw new Error("Telegram Bot Token \u672A\u914D\u7F6E");
      }
      if (!this.config.apiUrl) {
        throw new Error("Telegram API URL \u672A\u914D\u7F6E");
      }
      if (attempt === 1) {
        console.log(`\u{1F4F1} \u8FDB\u884C\u7F51\u7EDC\u8FDE\u901A\u6027\u68C0\u6D4B...`);
        const connectivityResult = await this.checkNetworkConnectivity();
        if (!connectivityResult.success) {
          console.log(`\u{1F4F1} \u7F51\u7EDC\u8FDE\u901A\u6027\u68C0\u6D4B\u5931\u8D25: ${connectivityResult.message}`);
        } else {
          console.log(`\u{1F4F1} \u7F51\u7EDC\u8FDE\u901A\u6027\u68C0\u6D4B\u901A\u8FC7: ${connectivityResult.message}`);
        }
      }
      const requestData = {
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
        parse_mode: "HTML"
      };
      console.log(`\u{1F4F1} \u51C6\u5907\u53D1\u9001\u6D88\u606F\u6570\u636E:`, {
        chat_id: chatId,
        text_length: message.length,
        disable_web_page_preview: true,
        apiUrl: `${this.config.apiUrl}/sendMessage`,
        attempt
      });
      console.log(`\u{1F4F1} \u5F00\u59CB\u53D1\u9001 HTTP \u8BF7\u6C42\u5230 Telegram API...`);
      console.log(`\u{1F4F1} \u8BF7\u6C42 URL: ${this.config.apiUrl}/sendMessage`);
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "lzreview-bot/1.0",
          "Accept": "application/json",
          "Connection": "keep-alive"
        },
        body: JSON.stringify(requestData),
        // Cloudflare Worker optimizations
        signal: AbortSignal.timeout(3e4),
        // 30秒超时
        redirect: "follow",
        referrerPolicy: "no-referrer"
      };
      console.log(`\u{1F4F1} \u53D1\u9001\u8BF7\u6C42\u914D\u7F6E:`, {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        timeout: "30s",
        attempt
      });
      const response = await fetch(`${this.config.apiUrl}/sendMessage`, fetchOptions);
      console.log(`\u{1F4F1} HTTP \u54CD\u5E94\u72B6\u6001: ${response.status} ${response.statusText}`);
      console.log(`\u{1F4F1} HTTP \u54CD\u5E94\u5934:`, Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.log(`\u{1F4F1} API \u539F\u59CB\u9519\u8BEF\u54CD\u5E94:`, responseText);
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.log(`\u{1F4F1} JSON \u89E3\u6790\u5931\u8D25:`, parseError.message);
            errorData = { description: responseText || response.statusText };
          }
        } catch (e) {
          console.log(`\u{1F4F1} \u8BFB\u53D6\u54CD\u5E94\u5931\u8D25:`, e.message);
          errorData = { description: response.statusText };
        }
        console.log(`\u{1F4F1} API \u89E3\u6790\u540E\u9519\u8BEF\u54CD\u5E94:`, errorData);
        let errorMessage = `HTTP ${response.status}`;
        if (errorData.description) {
          errorMessage += ` - ${errorData.description}`;
        }
        if (errorData.error_code) {
          errorMessage += ` (\u9519\u8BEF\u4EE3\u7801: ${errorData.error_code})`;
        }
        throw new Error(errorMessage);
      }
      console.log(`\u{1F4F1} \u5F00\u59CB\u89E3\u6790\u54CD\u5E94 JSON...`);
      const result = await response.json();
      console.log(`\u{1F4F1} API \u54CD\u5E94\u7ED3\u679C:`, result);
      if (!result.ok) {
        throw new Error(`Telegram API \u8FD4\u56DE\u9519\u8BEF: ${result.description}`);
      }
      console.log(`\u{1F4F1} \u6D88\u606F\u53D1\u9001\u6210\u529F - Message ID: ${result.result.message_id}`);
      return {
        success: true,
        message: "\u6D88\u606F\u53D1\u9001\u6210\u529F",
        messageId: result.result.message_id
      };
    } catch (error) {
      console.error(`\u{1F4F1} \u7B2C ${attempt} \u6B21\u6D88\u606F\u53D1\u9001\u5931\u8D25:`, error);
      let errorMessage = error.message;
      let errorType = "unknown";
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        errorMessage = "\u8BF7\u6C42\u8D85\u65F6 - Telegram API \u54CD\u5E94\u65F6\u95F4\u8FC7\u957F";
        errorType = "timeout";
      } else if (error.message.includes("fetch") || error.message.includes("Failed to fetch") || error.message.includes("network")) {
        errorMessage = "\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25 - \u65E0\u6CD5\u8FDE\u63A5\u5230 Telegram API\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5";
        errorType = "network";
      } else if (error.message.includes("internal error")) {
        errorMessage = "Cloudflare Worker \u5185\u90E8\u9519\u8BEF - \u53EF\u80FD\u662F\u7F51\u7EDC\u9650\u5236\u6216\u8D44\u6E90\u9650\u5236";
        errorType = "worker_error";
      } else if (error.message.includes("chat not found") || error.message.includes("Bad Request: chat not found")) {
        errorMessage = "\u804A\u5929\u672A\u627E\u5230 - \u8BF7\u68C0\u67E5 Chat ID \u662F\u5426\u6B63\u786E\uFF0C\u6216\u786E\u8BA4\u673A\u5668\u4EBA\u5DF2\u52A0\u5165\u7FA4\u7EC4/\u9891\u9053";
        errorType = "chat_not_found";
      } else if (error.message.includes("bot was blocked") || error.message.includes("Forbidden: bot was blocked")) {
        errorMessage = "\u673A\u5668\u4EBA\u88AB\u7528\u6237\u5C4F\u853D - \u8BF7\u8054\u7CFB\u7528\u6237\u89E3\u9664\u5C4F\u853D";
        errorType = "bot_blocked";
      } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
        errorMessage = "Bot Token \u65E0\u6548 - \u8BF7\u68C0\u67E5 TELEGRAM_BOT_TOKEN \u73AF\u5883\u53D8\u91CF\u914D\u7F6E";
        errorType = "unauthorized";
      } else if (error.message.includes("Bad Request")) {
        errorMessage = `\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF - ${error.message}`;
        errorType = "bad_request";
      } else if (error.message.includes("Too Many Requests") || error.message.includes("429")) {
        errorMessage = "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41 - Telegram API \u9650\u6D41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
        errorType = "rate_limit";
      } else if (error.message.includes("Internal Server Error") || error.message.includes("500")) {
        errorMessage = "Telegram \u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF - \u8BF7\u7A0D\u540E\u91CD\u8BD5";
        errorType = "server_error";
      }
      console.log(`\u{1F4F1} \u9519\u8BEF\u7C7B\u578B: ${errorType} (${error.name}), \u9519\u8BEF\u6D88\u606F: ${errorMessage}`);
      console.log(`\u{1F4F1} \u539F\u59CB\u9519\u8BEF:`, error);
      const detailedError = new Error(errorMessage);
      detailedError.type = errorType;
      detailedError.attempt = attempt;
      detailedError.originalError = error;
      throw detailedError;
    }
  }
  /**
   * 网络连通性检测
   */
  async checkNetworkConnectivity() {
    try {
      console.log(`\u{1F4F1} \u68C0\u6D4B\u5230 api.telegram.org \u7684\u8FDE\u901A\u6027...`);
      const response = await fetch("https://api.telegram.org/bot" + this.config.botToken + "/getMe", {
        method: "GET",
        headers: {
          "User-Agent": "lzreview-bot/1.0"
        },
        signal: AbortSignal.timeout(1e4)
        // 10秒超时
      });
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          return {
            success: true,
            message: `Bot @${result.result.username} \u8FDE\u63A5\u6B63\u5E38`
          };
        }
      }
      return {
        success: false,
        message: `HTTP ${response.status} - ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        message: `\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 测试Telegram推送功能
   */
  async test(testConfig = {}) {
    try {
      if (!this.config.botToken) {
        return {
          success: false,
          message: "Bot Token \u672A\u914D\u7F6E\uFF0C\u8BF7\u68C0\u67E5\u73AF\u5883\u53D8\u91CF TELEGRAM_BOT_TOKEN"
        };
      }
      if (!this.config.apiUrl) {
        return {
          success: false,
          message: "API URL \u672A\u914D\u7F6E\uFF0C\u8BF7\u68C0\u67E5 Bot Token \u683C\u5F0F"
        };
      }
      console.log("\u{1F4F1} \u914D\u7F6E\u68C0\u67E5\u5B8C\u6210\uFF0C\u5F00\u59CB\u9A8C\u8BC1Bot Token...");
      const testChatId = testConfig.testChatId;
      if (!testChatId) {
        return {
          success: false,
          message: "\u8BF7\u63D0\u4F9B\u6D4B\u8BD5\u7528\u7684 Chat ID"
        };
      }
      console.log("\u{1F4F1} \u53D1\u9001\u6D4B\u8BD5\u6D88\u606F...");
      const testMessage = this.generateTestMessage();
      const result = await this.sendMessage(testChatId, testMessage);
      return {
        success: result.success,
        message: result.success ? `\u6D4B\u8BD5\u6D88\u606F\u5DF2\u53D1\u9001\u5230 Chat ID: ${testChatId}` : `\u6D4B\u8BD5\u6D88\u606F\u53D1\u9001\u5931\u8D25: ${result.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Telegram\u63A8\u9001\u6D4B\u8BD5\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 生成测试消息
   */
  generateTestMessage() {
    return `\u{1F9EA} lzreview Telegram\u63A8\u9001\u6D4B\u8BD5

\u2705 \u5982\u679C\u60A8\u6536\u5230\u8FD9\u6761\u6D88\u606F\uFF0C\u8BF4\u660ETelegram\u63A8\u9001\u529F\u80FD\u6B63\u5E38\u5DE5\u4F5C

\u{1F4CA} \u6D4B\u8BD5\u4FE1\u606F:
\u2022 \u6D4B\u8BD5\u65F6\u95F4: ${this.formatDate(/* @__PURE__ */ new Date())}
\u2022 \u63A8\u9001\u65B9\u5F0F: Telegram Bot API
\u2022 \u6D88\u606F\u683C\u5F0F: \u7EAF\u6587\u672C

\u8FD9\u662F\u6765\u81EA lzreview \u8BC4\u8BBA\u7CFB\u7EDF\u7684\u6D4B\u8BD5\u6D88\u606F`;
  }
  /**
   * 获取Bot信息（用于验证Token）
   */
  async getBotInfo() {
    try {
      if (!this.config.botToken) {
        throw new Error("Telegram Bot Token \u672A\u914D\u7F6E");
      }
      if (!this.config.apiUrl) {
        throw new Error("Telegram API URL \u672A\u914D\u7F6E");
      }
      const response = await fetch(`${this.config.apiUrl}/getMe`, {
        method: "GET"
      });
      if (!response.ok) {
        throw new Error(`HTTP\u9519\u8BEF: ${response.status}`);
      }
      const result = await response.json();
      if (!result.ok) {
        throw new Error(`API\u9519\u8BEF: ${result.description}`);
      }
      return {
        success: true,
        botInfo: result.result
      };
    } catch (error) {
      return {
        success: false,
        message: `\u83B7\u53D6Bot\u4FE1\u606F\u5931\u8D25: ${error.message}`
      };
    }
  }
  /**
   * 转义HTML特殊字符
   */
  escapeHTML(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }
};

// src/services/notification.js
var NotificationService = class {
  static {
    __name(this, "NotificationService");
  }
  constructor(env) {
    this.env = env;
    this.notifiers = {};
    this.initializeNotifiers();
  }
  /**
   * 初始化通知推送器
   */
  initializeNotifiers() {
    if (this.env.RESEND_API_KEY) {
      this.notifiers.email = new EmailNotifier({
        apiKey: this.env.RESEND_API_KEY,
        fromName: this.env.NOTIFICATION_FROM_NAME || "lzreview\u8BC4\u8BBA\u7CFB\u7EDF",
        fromEmail: this.env.NOTIFICATION_FROM_EMAIL || "notifications@example.com"
      });
    }
    if (this.env.TELEGRAM_BOT_TOKEN) {
      this.notifiers.telegram = new TelegramNotifier({
        botToken: this.env.TELEGRAM_BOT_TOKEN,
        parseMode: this.env.TELEGRAM_PARSE_MODE || "HTML"
      });
    }
  }
  /**
   * 获取可用的推送器列表
   */
  getAvailableNotifiers() {
    return Object.keys(this.notifiers);
  }
  /**
   * 检查指定推送器是否可用
   */
  isNotifierAvailable(type) {
    return !!this.notifiers[type];
  }
  /**
   * 发送新评论通知
   */
  async sendNewCommentNotification(commentData, notificationConfig) {
    const notifications = [];
    try {
      if (notificationConfig.email && this.notifiers.email) {
        const emailResult = await this.notifiers.email.sendNewCommentNotification(
          commentData,
          notificationConfig.email
        );
        notifications.push({
          type: "email",
          success: emailResult.success,
          message: emailResult.message,
          details: emailResult.details
        });
      }
      if (notificationConfig.telegram && this.notifiers.telegram) {
        const telegramResult = await this.notifiers.telegram.sendNewCommentNotification(
          commentData,
          notificationConfig.telegram
        );
        notifications.push({
          type: "telegram",
          success: telegramResult.success,
          message: telegramResult.message,
          details: telegramResult.details
        });
      }
      return {
        success: notifications.some((n) => n.success),
        results: notifications,
        summary: this.generateNotificationSummary(notifications)
      };
    } catch (error) {
      console.error("\u901A\u77E5\u53D1\u9001\u5931\u8D25:", error);
      return {
        success: false,
        error: error.message,
        results: notifications
      };
    }
  }
  /**
   * 测试推送器连接
   */
  async testNotifier(type, config) {
    if (!this.notifiers[type]) {
      return {
        success: false,
        message: `\u63A8\u9001\u5668\u7C7B\u578B "${type}" \u4E0D\u53EF\u7528`
      };
    }
    try {
      return await this.notifiers[type].test(config);
    } catch (error) {
      console.error(`\u6D4B\u8BD5${type}\u63A8\u9001\u5668\u5931\u8D25:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  /**
   * 生成通知结果摘要
   */
  generateNotificationSummary(notifications) {
    const total = notifications.length;
    const successful = notifications.filter((n) => n.success).length;
    const failed = total - successful;
    if (total === 0) {
      return "\u672A\u914D\u7F6E\u4EFB\u4F55\u901A\u77E5\u65B9\u5F0F";
    }
    if (successful === total) {
      return `\u6240\u6709\u901A\u77E5\u53D1\u9001\u6210\u529F (${successful}/${total})`;
    } else if (successful === 0) {
      return `\u6240\u6709\u901A\u77E5\u53D1\u9001\u5931\u8D25 (${failed}/${total})`;
    } else {
      return `\u90E8\u5206\u901A\u77E5\u53D1\u9001\u6210\u529F (${successful}/${total})\uFF0C${failed}\u4E2A\u5931\u8D25`;
    }
  }
  /**
   * 获取通知配置模板
   */
  getNotificationConfigTemplate() {
    return {
      email: {
        enabled: false,
        recipients: [],
        // 管理员邮箱列表
        subscribers: [],
        // 订阅者邮箱列表
        includePageInfo: true,
        includeCommentContent: true,
        template: "default"
      },
      telegram: {
        enabled: false,
        chatIds: [],
        // 接收通知的Chat ID列表
        includePageInfo: true,
        includeCommentContent: true,
        template: "default"
      },
      // 未来扩展的配置项
      webhook: {
        enabled: false,
        url: "",
        method: "POST",
        headers: {},
        template: "default"
      }
    };
  }
};
var NotificationUtils = class {
  static {
    __name(this, "NotificationUtils");
  }
  /**
   * 验证邮箱地址
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  /**
   * 验证Telegram Chat ID
   */
  static isValidChatId(chatId) {
    if (typeof chatId === "number") {
      return true;
    }
    if (typeof chatId === "string") {
      return /^@[\w_]+$/.test(chatId) || /^-?\d+$/.test(chatId);
    }
    return false;
  }
  /**
   * 验证通知配置
   */
  static validateNotificationConfig(config) {
    const errors = [];
    if (config.email && config.email.enabled) {
      if (!config.email.recipients || !Array.isArray(config.email.recipients)) {
        errors.push("\u90AE\u7BB1\u914D\u7F6E\uFF1A\u6536\u4EF6\u4EBA\u5217\u8868\u5FC5\u987B\u662F\u6570\u7EC4");
      } else {
        config.email.recipients.forEach((email, index) => {
          if (!this.isValidEmail(email)) {
            errors.push(`\u90AE\u7BB1\u914D\u7F6E\uFF1A\u7B2C${index + 1}\u4E2A\u6536\u4EF6\u4EBA\u90AE\u7BB1\u683C\u5F0F\u65E0\u6548 - ${email}`);
          }
        });
      }
      if (config.email.subscribers && Array.isArray(config.email.subscribers)) {
        config.email.subscribers.forEach((email, index) => {
          if (!this.isValidEmail(email)) {
            errors.push(`\u90AE\u7BB1\u914D\u7F6E\uFF1A\u7B2C${index + 1}\u4E2A\u8BA2\u9605\u8005\u90AE\u7BB1\u683C\u5F0F\u65E0\u6548 - ${email}`);
          }
        });
      }
    }
    if (config.telegram && config.telegram.enabled) {
      if (!config.telegram.chatIds || !Array.isArray(config.telegram.chatIds)) {
        errors.push("Telegram\u914D\u7F6E\uFF1AChat ID\u5217\u8868\u5FC5\u987B\u662F\u6570\u7EC4");
      } else if (config.telegram.chatIds.length === 0) {
        errors.push("Telegram\u914D\u7F6E\uFF1A\u81F3\u5C11\u9700\u8981\u914D\u7F6E\u4E00\u4E2AChat ID");
      } else {
        config.telegram.chatIds.forEach((chatId, index) => {
          if (!this.isValidChatId(chatId)) {
            errors.push(`Telegram\u914D\u7F6E\uFF1A\u7B2C${index + 1}\u4E2AChat ID\u683C\u5F0F\u65E0\u6548 - ${chatId}`);
          }
        });
      }
    }
    if (config.webhook && config.webhook.enabled) {
      if (!config.webhook.url || !config.webhook.url.startsWith("http")) {
        errors.push("Webhook\u914D\u7F6E\uFF1AURL\u5730\u5740\u65E0\u6548");
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * 清理和格式化评论数据用于通知
   */
  static formatCommentForNotification(comment) {
    return {
      id: comment.id,
      pageUrl: comment.pageUrl || comment.page_url,
      pageTitle: comment.pageTitle || this.extractPageTitle(comment.pageUrl || comment.page_url),
      authorName: comment.authorName || comment.author_name,
      authorEmail: comment.authorEmail || comment.author_email,
      content: comment.content,
      createdAt: comment.createdAt || comment.created_at,
      parentId: comment.parentId || comment.parent_id,
      isReply: !!(comment.parentId || comment.parent_id)
    };
  }
  /**
   * 从URL提取页面标题（简单实现）
   */
  static extractPageTitle(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const title = pathname.split("/").filter((segment) => segment && segment !== "index").pop() || urlObj.hostname;
      return title.replace(/\.(html|htm|php)$/, "") || "\u672A\u77E5\u9875\u9762";
    } catch {
      return "\u672A\u77E5\u9875\u9762";
    }
  }
  /**
   * 生成通知摘要文本
   */
  static generateNotificationDigest(comments, timeFrame = "24\u5C0F\u65F6") {
    if (!comments || comments.length === 0) {
      return `\u8FC7\u53BB${timeFrame}\u5185\u6CA1\u6709\u65B0\u8BC4\u8BBA`;
    }
    const pageGroups = {};
    comments.forEach((comment) => {
      const pageUrl = comment.pageUrl || comment.page_url;
      if (!pageGroups[pageUrl]) {
        pageGroups[pageUrl] = [];
      }
      pageGroups[pageUrl].push(comment);
    });
    const summary = Object.entries(pageGroups).map(([pageUrl, pageComments]) => {
      const pageTitle = this.extractPageTitle(pageUrl);
      return `${pageTitle}: ${pageComments.length}\u6761\u8BC4\u8BBA`;
    }).join("\uFF0C");
    return `\u8FC7\u53BB${timeFrame}\u5185\u6536\u5230${comments.length}\u6761\u65B0\u8BC4\u8BBA\uFF1A${summary}`;
  }
};

// src/handlers/notifications.js
async function handleNotifications(request, db, env) {
  const url = new URL(request.url);
  const method = request.method;
  try {
    switch (method) {
      case "GET":
        if (url.pathname === "/api/notifications/config") {
          return await getNotificationConfig(request, db);
        }
        if (url.pathname === "/api/notifications/notifiers") {
          return await getAvailableNotifiers(request, env);
        }
        if (url.pathname === "/api/notifications/subscribers") {
          return await getEmailSubscribers(request, db);
        }
        if (url.pathname === "/api/notifications/telegram-subscribers") {
          return await getTelegramSubscribers(request, db);
        }
        return errorResponse("\u672A\u627E\u5230\u5BF9\u5E94\u7684API\u7AEF\u70B9", 404);
      case "POST":
        if (url.pathname === "/api/notifications/config") {
          return await updateNotificationConfig(request, db);
        }
        if (url.pathname === "/api/notifications/test") {
          return await testNotificationService(request, db, env);
        }
        if (url.pathname === "/api/notifications/subscribe") {
          return await addEmailSubscriber(request, db);
        }
        if (url.pathname === "/api/notifications/telegram-subscribe") {
          return await addTelegramSubscriber(request, db);
        }
        if (url.pathname === "/api/notifications/send") {
          return await sendManualNotification(request, db, env);
        }
        return errorResponse("\u672A\u627E\u5230\u5BF9\u5E94\u7684API\u7AEF\u70B9", 404);
      case "DELETE":
        if (url.pathname.startsWith("/api/notifications/subscribe/")) {
          return await removeEmailSubscriber(request, db);
        }
        if (url.pathname.startsWith("/api/notifications/telegram-subscribe/")) {
          return await removeTelegramSubscriber(request, db);
        }
        return errorResponse("\u672A\u627E\u5230\u5BF9\u5E94\u7684API\u7AEF\u70B9", 404);
      default:
        return errorResponse("\u4E0D\u652F\u6301\u7684\u8BF7\u6C42\u65B9\u6CD5", 405);
    }
  } catch (error) {
    console.error("\u901A\u77E5API\u9519\u8BEF:", error);
    return errorResponse("\u5904\u7406\u901A\u77E5\u8BF7\u6C42\u65F6\u53D1\u751F\u9519\u8BEF", 500);
  }
}
__name(handleNotifications, "handleNotifications");
async function getNotificationConfig(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const config = await db.getNotificationConfig();
    return successResponse(config);
  } catch (error) {
    console.error("\u83B7\u53D6\u901A\u77E5\u914D\u7F6E\u5931\u8D25:", error);
    const notificationService = new NotificationService();
    return successResponse(notificationService.getNotificationConfigTemplate());
  }
}
__name(getNotificationConfig, "getNotificationConfig");
async function updateNotificationConfig(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const data = await request.json();
    const validation = NotificationUtils.validateNotificationConfig(data);
    if (!validation.isValid) {
      return errorResponse(`\u914D\u7F6E\u9A8C\u8BC1\u5931\u8D25: ${validation.errors.join("; ")}`);
    }
    await db.saveNotificationConfig(data);
    return successResponse(null, "\u901A\u77E5\u914D\u7F6E\u66F4\u65B0\u6210\u529F");
  } catch (error) {
    console.error("\u66F4\u65B0\u901A\u77E5\u914D\u7F6E\u5931\u8D25:", error);
    return errorResponse("\u66F4\u65B0\u901A\u77E5\u914D\u7F6E\u5931\u8D25");
  }
}
__name(updateNotificationConfig, "updateNotificationConfig");
async function getAvailableNotifiers(request, env) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  try {
    const notificationService = new NotificationService(env);
    const availableNotifiers = notificationService.getAvailableNotifiers();
    const notifiersInfo = {
      email: {
        available: notificationService.isNotifierAvailable("email"),
        name: "\u90AE\u7BB1\u63A8\u9001",
        description: "\u901A\u8FC7 Resend API \u53D1\u9001\u90AE\u4EF6\u901A\u77E5",
        requiredEnvVars: ["RESEND_API_KEY"],
        configured: !!env.RESEND_API_KEY
      },
      telegram: {
        available: notificationService.isNotifierAvailable("telegram"),
        name: "Telegram\u63A8\u9001",
        description: "\u901A\u8FC7 Telegram Bot API \u53D1\u9001\u6D88\u606F\u901A\u77E5",
        requiredEnvVars: ["TELEGRAM_BOT_TOKEN"],
        configured: !!env.TELEGRAM_BOT_TOKEN
      }
      // 未来可以添加更多推送器信息，如：
      // webhook: { ... }
      // wechat: { ... }
      // dingtalk: { ... }
    };
    return successResponse({
      available: availableNotifiers,
      notifiers: notifiersInfo
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u63A8\u9001\u5668\u5217\u8868\u5931\u8D25:", error);
    return errorResponse("\u83B7\u53D6\u63A8\u9001\u5668\u5217\u8868\u5931\u8D25");
  }
}
__name(getAvailableNotifiers, "getAvailableNotifiers");
async function testNotificationService(request, db, env) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const data = await request.json();
    const { type, config } = data;
    if (!type) {
      return errorResponse("\u8BF7\u6307\u5B9A\u8981\u6D4B\u8BD5\u7684\u63A8\u9001\u5668\u7C7B\u578B");
    }
    const notificationService = new NotificationService(env);
    if (!notificationService.isNotifierAvailable(type)) {
      return errorResponse(`\u63A8\u9001\u5668\u7C7B\u578B "${type}" \u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u73AF\u5883\u53D8\u91CF\u914D\u7F6E`);
    }
    const testResult = await notificationService.testNotifier(type, config);
    if (testResult.success) {
      return successResponse(testResult, "\u63A8\u9001\u5668\u6D4B\u8BD5\u6210\u529F");
    } else {
      return errorResponse(`\u63A8\u9001\u5668\u6D4B\u8BD5\u5931\u8D25: ${testResult.message}`);
    }
  } catch (error) {
    console.error("\u6D4B\u8BD5\u901A\u77E5\u670D\u52A1\u5931\u8D25:", error);
    return errorResponse("\u6D4B\u8BD5\u901A\u77E5\u670D\u52A1\u5931\u8D25");
  }
}
__name(testNotificationService, "testNotificationService");
async function sendManualNotification(request, db, env) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const data = await request.json();
    const { commentId, testEmail } = data;
    let commentData;
    if (commentId) {
      commentData = await db.getCommentById(commentId);
      if (!commentData) {
        return errorResponse("\u8BC4\u8BBA\u4E0D\u5B58\u5728");
      }
    } else {
      commentData = {
        id: "test-" + Date.now(),
        pageUrl: "https://example.com/test-page",
        pageTitle: "\u6D4B\u8BD5\u9875\u9762",
        authorName: "\u6D4B\u8BD5\u7528\u6237",
        authorEmail: "test@example.com",
        content: "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u8BC4\u8BBA\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u901A\u77E5\u63A8\u9001\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        parentId: null,
        isReply: false
      };
    }
    const notificationConfig = await db.getNotificationConfig();
    if (testEmail && NotificationUtils.isValidEmail(testEmail)) {
      notificationConfig.email = {
        ...notificationConfig.email,
        enabled: true,
        recipients: [testEmail],
        subscribers: []
      };
    }
    const notificationService = new NotificationService(env);
    const formattedComment = NotificationUtils.formatCommentForNotification(commentData);
    const result = await notificationService.sendNewCommentNotification(
      formattedComment,
      notificationConfig
    );
    if (result.success) {
      return successResponse(result, "\u901A\u77E5\u53D1\u9001\u6210\u529F");
    } else {
      return errorResponse(`\u901A\u77E5\u53D1\u9001\u5931\u8D25: ${result.error || result.summary}`);
    }
  } catch (error) {
    console.error("\u53D1\u9001\u624B\u52A8\u901A\u77E5\u5931\u8D25:", error);
    return errorResponse("\u53D1\u9001\u624B\u52A8\u901A\u77E5\u5931\u8D25");
  }
}
__name(sendManualNotification, "sendManualNotification");
async function getEmailSubscribers(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const subscribers = await db.getEmailSubscribers();
    return successResponse({ subscribers });
  } catch (error) {
    console.error("\u83B7\u53D6\u90AE\u4EF6\u8BA2\u9605\u5217\u8868\u5931\u8D25:", error);
    return successResponse({ subscribers: [] });
  }
}
__name(getEmailSubscribers, "getEmailSubscribers");
async function addEmailSubscriber(request, db) {
  try {
    const data = await request.json();
    const { email, name, pageUrl } = data;
    if (!email || !NotificationUtils.isValidEmail(email)) {
      return errorResponse("\u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740");
    }
    const existingSubscriber = await db.getEmailSubscriber(email);
    if (existingSubscriber) {
      return errorResponse("\u8BE5\u90AE\u7BB1\u5DF2\u7ECF\u8BA2\u9605\u4E86\u901A\u77E5");
    }
    const subscriberId = await db.addEmailSubscriber({
      email,
      name: name || email.split("@")[0],
      pageUrl: pageUrl || null,
      subscribedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: true
    });
    return successResponse({
      id: subscriberId,
      message: "\u90AE\u7BB1\u8BA2\u9605\u6210\u529F"
    }, "\u90AE\u7BB1\u8BA2\u9605\u6210\u529F");
  } catch (error) {
    console.error("\u6DFB\u52A0\u90AE\u4EF6\u8BA2\u9605\u5931\u8D25:", error);
    return errorResponse("\u6DFB\u52A0\u90AE\u4EF6\u8BA2\u9605\u5931\u8D25");
  }
}
__name(addEmailSubscriber, "addEmailSubscriber");
async function removeEmailSubscriber(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const emailOrId = decodeURIComponent(pathParts[pathParts.length - 1]);
    if (!emailOrId) {
      return errorResponse("\u8BF7\u63D0\u4F9B\u90AE\u7BB1\u5730\u5740\u6216\u8BA2\u9605ID");
    }
    let deleted = false;
    if (NotificationUtils.isValidEmail(emailOrId)) {
      deleted = await db.removeEmailSubscriberByEmail(emailOrId);
    } else {
      deleted = await db.removeEmailSubscriberById(emailOrId);
    }
    if (deleted) {
      return successResponse(null, "\u53D6\u6D88\u8BA2\u9605\u6210\u529F");
    } else {
      return errorResponse("\u672A\u627E\u5230\u5BF9\u5E94\u7684\u8BA2\u9605\u8BB0\u5F55", 404);
    }
  } catch (error) {
    console.error("\u5220\u9664\u90AE\u4EF6\u8BA2\u9605\u5931\u8D25:", error);
    return errorResponse("\u5220\u9664\u90AE\u4EF6\u8BA2\u9605\u5931\u8D25");
  }
}
__name(removeEmailSubscriber, "removeEmailSubscriber");
async function triggerCommentNotification(commentData, db, env) {
  try {
    const notificationConfig = await db.getNotificationConfig();
    const hasEnabledNotifications = notificationConfig.email && notificationConfig.email.enabled || notificationConfig.telegram && notificationConfig.telegram.enabled || notificationConfig.webhook && notificationConfig.webhook.enabled;
    if (!hasEnabledNotifications) {
      return { success: true, message: "\u672A\u914D\u7F6E\u901A\u77E5" };
    }
    const notificationService = new NotificationService(env);
    const formattedComment = NotificationUtils.formatCommentForNotification(commentData);
    const result = await notificationService.sendNewCommentNotification(
      formattedComment,
      notificationConfig
    );
    return result;
  } catch (error) {
    console.error("\u901A\u77E5\u63A8\u9001\u5931\u8D25:", error.message);
    return { success: false, error: error.message };
  }
}
__name(triggerCommentNotification, "triggerCommentNotification");
async function getTelegramSubscribers(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const subscribers = await db.getTelegramSubscribers();
    return successResponse({ subscribers });
  } catch (error) {
    console.error("\u83B7\u53D6 Telegram \u8BA2\u9605\u5217\u8868\u5931\u8D25:", error);
    return successResponse({ subscribers: [] });
  }
}
__name(getTelegramSubscribers, "getTelegramSubscribers");
async function addTelegramSubscriber(request, db) {
  try {
    const data = await request.json();
    const { chatId, name, chatType, pageUrl } = data;
    if (!chatId || !NotificationUtils.isValidChatId(chatId)) {
      return errorResponse("\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 Chat ID");
    }
    const existingSubscriber = await db.getTelegramSubscriber(chatId);
    if (existingSubscriber) {
      return errorResponse("\u8BE5 Chat ID \u5DF2\u7ECF\u8BA2\u9605\u4E86\u901A\u77E5");
    }
    const subscriberId = await db.addTelegramSubscriber({
      chatId,
      name: name || `Chat ${chatId}`,
      chatType: chatType || "private",
      pageUrl: pageUrl || null,
      subscribedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: true
    });
    return successResponse({
      id: subscriberId,
      message: "Telegram \u8BA2\u9605\u6210\u529F"
    }, "Telegram \u8BA2\u9605\u6210\u529F");
  } catch (error) {
    console.error("\u6DFB\u52A0 Telegram \u8BA2\u9605\u5931\u8D25:", error);
    return errorResponse("\u6DFB\u52A0 Telegram \u8BA2\u9605\u5931\u8D25");
  }
}
__name(addTelegramSubscriber, "addTelegramSubscriber");
async function removeTelegramSubscriber(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const chatIdOrId = decodeURIComponent(pathParts[pathParts.length - 1]);
    if (!chatIdOrId) {
      return errorResponse("\u8BF7\u63D0\u4F9B Chat ID \u6216\u8BA2\u9605ID");
    }
    let deleted = false;
    if (NotificationUtils.isValidChatId(chatIdOrId)) {
      deleted = await db.removeTelegramSubscriberByChatId(chatIdOrId);
    } else {
      deleted = await db.removeTelegramSubscriberById(chatIdOrId);
    }
    if (deleted) {
      return successResponse(null, "\u53D6\u6D88\u8BA2\u9605\u6210\u529F");
    } else {
      return errorResponse("\u672A\u627E\u5230\u5BF9\u5E94\u7684\u8BA2\u9605\u8BB0\u5F55", 404);
    }
  } catch (error) {
    console.error("\u5220\u9664 Telegram \u8BA2\u9605\u5931\u8D25:", error);
    return errorResponse("\u5220\u9664 Telegram \u8BA2\u9605\u5931\u8D25");
  }
}
__name(removeTelegramSubscriber, "removeTelegramSubscriber");

// src/handlers/comments.js
var cache = /* @__PURE__ */ new Map();
var csrfTokens = /* @__PURE__ */ new Map();
async function handleComments(request, db, env, ctx) {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);
  try {
    const ipHash = await hashIP(ip);
    const isAllowed = await db.checkRateLimit(ipHash, 10, 1);
    if (!isAllowed) {
      return errorResponse("\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", 429);
    }
  } catch (error) {
    console.error("Rate limit check error:", error);
    if (!rateLimitCheck(ip, cache)) {
      return errorResponse("\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", 429);
    }
  }
  try {
    switch (method) {
      case "GET":
        if (url.pathname === "/api/comments/csrf-token") {
          return await getCSRFToken(request);
        }
        if (url.pathname === "/api/comments/all") {
          return await getAllCommentsForAdmin(request, db);
        }
        if (url.pathname === "/api/comments/stats") {
          return await getStatsForAdmin(request, db);
        }
        if (url.pathname === "/api/comments/pages") {
          return await getPagesForAdmin(request, db);
        }
        return await getComments(request, db);
      case "POST":
        return await createComment(request, db, env, ctx);
      case "DELETE":
        if (url.pathname === "/api/comments/batch") {
          return await batchDeleteComments(request, db);
        }
        if (url.pathname === "/api/comments/page") {
          return await deletePageComments(request, db);
        }
        return await deleteComment(request, db);
      default:
        return errorResponse("\u4E0D\u652F\u6301\u7684\u8BF7\u6C42\u65B9\u6CD5", 405);
    }
  } catch (error) {
    console.error("API Error:", error);
    const safeMessage = sanitizeErrorMessage(error);
    return errorResponse(safeMessage, 500);
  }
}
__name(handleComments, "handleComments");
async function getComments(request, db) {
  const url = new URL(request.url);
  const pageUrl = url.searchParams.get("page");
  const limit = Math.min(parseInt(url.searchParams.get("limit")) || 50, 100);
  const offset = parseInt(url.searchParams.get("offset")) || 0;
  if (!pageUrl) {
    return errorResponse("\u7F3A\u5C11\u9875\u9762URL\u53C2\u6570");
  }
  const decodedPageUrl = decodeURIComponent(pageUrl);
  try {
    const urlObj = new URL(decodedPageUrl);
    const hostname = urlObj.hostname;
    const hostWithPort = urlObj.host;
    const isHostnameWhitelisted = await db.isWhitelisted(hostname);
    const isHostWithPortWhitelisted = await db.isWhitelisted(hostWithPort);
    if (!isHostnameWhitelisted && !isHostWithPortWhitelisted) {
      return errorResponse(`\u8BC4\u8BBA\u7CFB\u7EDF\u5DF2\u8BBE\u7F6E\u4E3A\u767D\u540D\u5355\u6A21\u5F0F\uFF0C\u57DF\u540D ${hostWithPort} \u672A\u88AB\u6388\u6743\u4F7F\u7528\u8BC4\u8BBA\u529F\u80FD\u3002\u8BF7\u8054\u7CFB\u7CFB\u7EDF\u7BA1\u7406\u5458\u3002`, 403);
    }
  } catch (error) {
    console.error("\u767D\u540D\u5355\u9A8C\u8BC1\u5931\u8D25:", error);
    return errorResponse("\u57DF\u540D\u9A8C\u8BC1\u5931\u8D25");
  }
  try {
    const comments = await db.getComments(decodedPageUrl, limit, offset);
    const total = await db.getCommentCount(decodedPageUrl);
    const commentsTree = buildCommentsTree(comments);
    return successResponse({
      comments: commentsTree,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return errorResponse("\u83B7\u53D6\u8BC4\u8BBA\u5931\u8D25");
  }
}
__name(getComments, "getComments");
async function createComment(request, db, env, ctx) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      return errorResponse("\u8BF7\u6C42\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
    }
    try {
      const urlObj = new URL(data.pageUrl);
      const hostname = urlObj.hostname;
      const hostWithPort = urlObj.host;
      const isHostnameWhitelisted = await db.isWhitelisted(hostname);
      const isHostWithPortWhitelisted = await db.isWhitelisted(hostWithPort);
      if (!isHostnameWhitelisted && !isHostWithPortWhitelisted) {
        return errorResponse(`\u8BC4\u8BBA\u7CFB\u7EDF\u5DF2\u8BBE\u7F6E\u4E3A\u767D\u540D\u5355\u6A21\u5F0F\uFF0C\u57DF\u540D ${hostWithPort} \u672A\u88AB\u6388\u6743\u4F7F\u7528\u8BC4\u8BBA\u529F\u80FD\u3002\u8BF7\u8054\u7CFB\u7CFB\u7EDF\u7BA1\u7406\u5458\u3002`, 403);
      }
    } catch (error) {
      console.error("\u767D\u540D\u5355\u9A8C\u8BC1\u5931\u8D25:", error);
      return errorResponse("\u57DF\u540D\u9A8C\u8BC1\u5931\u8D25");
    }
    const validation = validateComment(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join("; "));
    }
    if (containsBadWords(data.content) || containsBadWords(data.authorName)) {
      return errorResponse("\u8BC4\u8BBA\u5305\u542B\u4E0D\u5F53\u5185\u5BB9\uFF0C\u8BF7\u4FEE\u6539\u540E\u91CD\u8BD5");
    }
    const clientIP = getClientIP(request);
    const hashedIP = await hashIP(clientIP);
    const sanitizedData = {
      pageUrl: data.pageUrl,
      authorName: sanitizeInput(data.authorName.trim()),
      authorEmail: data.authorEmail ? data.authorEmail.trim() : null,
      authorQQ: data.authorQQ ? data.authorQQ.trim() : null,
      content: sanitizeInput(data.content.trim()),
      parentId: data.parentId || null,
      ipAddress: hashedIP,
      // 存储哈希后的IP
      userAgent: getUserAgent(request)
    };
    try {
      const commentId = await db.addComment(sanitizedData);
      const commentDataForNotification = {
        ...sanitizedData,
        id: commentId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      ctx.waitUntil(
        triggerCommentNotification(commentDataForNotification, db, env).then((result) => {
          if (result.success) {
            console.log("\u{1F4EC} \u8BC4\u8BBA\u901A\u77E5\u53D1\u9001\u6210\u529F");
          } else {
            console.error("\u{1F4EC} \u901A\u77E5\u53D1\u9001\u5931\u8D25:", result.error || result.summary);
          }
        }).catch((error) => {
          console.error("\u{1F4EC} \u901A\u77E5\u53D1\u9001\u5F02\u5E38:", error.message);
        })
      );
      return successResponse(
        {
          id: commentId,
          message: "\u8BC4\u8BBA\u53D1\u5E03\u6210\u529F"
        },
        "\u8BC4\u8BBA\u53D1\u5E03\u6210\u529F"
      );
    } catch (dbError) {
      console.error("Database insert error:", dbError);
      const safeMessage = sanitizeErrorMessage(dbError);
      return errorResponse(`\u53D1\u5E03\u8BC4\u8BBA\u5931\u8D25\uFF1A${safeMessage}`);
    }
  } catch (error) {
    console.error("Create comment error:", error);
    const safeMessage = sanitizeErrorMessage(error);
    return errorResponse(`\u53D1\u5E03\u8BC4\u8BBA\u5931\u8D25\uFF1A${safeMessage}`);
  }
}
__name(createComment, "createComment");
async function deleteComment(request, db) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const commentId = pathParts[pathParts.length - 1];
  if (!commentId || isNaN(commentId)) {
    return errorResponse("\u65E0\u6548\u7684\u8BC4\u8BBAID");
  }
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  try {
    const deleted = await db.deleteComment(parseInt(commentId), token);
    if (deleted) {
      return successResponse(null, "\u8BC4\u8BBA\u5220\u9664\u6210\u529F");
    } else {
      return errorResponse("\u8BC4\u8BBA\u4E0D\u5B58\u5728\u6216\u5220\u9664\u5931\u8D25", 404);
    }
  } catch (error) {
    if (error.message === "Unauthorized") {
      return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
    }
    console.error("Delete comment error:", error);
    return errorResponse("\u5220\u9664\u8BC4\u8BBA\u5931\u8D25");
  }
}
__name(deleteComment, "deleteComment");
function buildCommentsTree(comments) {
  const commentMap = {};
  const rootComments = [];
  comments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment.id] = comment;
  });
  comments.forEach((comment) => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies.push(comment);
    } else {
      rootComments.push(comment);
    }
  });
  return rootComments;
}
__name(buildCommentsTree, "buildCommentsTree");
async function getAllCommentsForAdmin(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const comments = await db.getAllComments();
    return successResponse({ comments });
  } catch (error) {
    console.error("Get all comments error:", error);
    return errorResponse("\u83B7\u53D6\u8BC4\u8BBA\u5931\u8D25");
  }
}
__name(getAllCommentsForAdmin, "getAllCommentsForAdmin");
async function getStatsForAdmin(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const stats = await db.getStats();
    return successResponse(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    return errorResponse("\u83B7\u53D6\u7EDF\u8BA1\u4FE1\u606F\u5931\u8D25");
  }
}
__name(getStatsForAdmin, "getStatsForAdmin");
async function getPagesForAdmin(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const pages = await db.getPages();
    return successResponse({ pages });
  } catch (error) {
    console.error("Get pages error:", error);
    return errorResponse("\u83B7\u53D6\u9875\u9762\u5217\u8868\u5931\u8D25");
  }
}
__name(getPagesForAdmin, "getPagesForAdmin");
async function batchDeleteComments(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const data = await request.json();
    const { ids } = data;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse("\u8BF7\u63D0\u4F9B\u8981\u5220\u9664\u7684\u8BC4\u8BBAID\u5217\u8868");
    }
    const deletedCount = await db.batchDeleteComments(ids);
    return successResponse({ deletedCount }, `\u6210\u529F\u5220\u9664 ${deletedCount} \u6761\u8BC4\u8BBA`);
  } catch (error) {
    console.error("Batch delete error:", error);
    return errorResponse("\u6279\u91CF\u5220\u9664\u5931\u8D25");
  }
}
__name(batchDeleteComments, "batchDeleteComments");
async function deletePageComments(request, db) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  if (!db.isValidAdmin(token)) {
    return errorResponse("\u7BA1\u7406\u5458\u6743\u9650\u9A8C\u8BC1\u5931\u8D25", 403);
  }
  try {
    const data = await request.json();
    const { pageUrl } = data;
    if (!pageUrl) {
      return errorResponse("\u8BF7\u63D0\u4F9B\u9875\u9762URL");
    }
    const deletedCount = await db.deletePageComments(pageUrl);
    return successResponse({ deletedCount }, `\u6210\u529F\u5220\u9664 ${deletedCount} \u6761\u8BC4\u8BBA`);
  } catch (error) {
    console.error("Delete page comments error:", error);
    return errorResponse("\u5220\u9664\u9875\u9762\u8BC4\u8BBA\u5931\u8D25");
  }
}
__name(deletePageComments, "deletePageComments");
async function getCSRFToken(request) {
  const ip = getClientIP(request);
  const token = generateCSRFToken();
  const expiresAt = Date.now() + 30 * 60 * 1e3;
  csrfTokens.set(ip, { token, expiresAt });
  cleanExpiredTokens();
  return successResponse({ csrfToken: token });
}
__name(getCSRFToken, "getCSRFToken");
function cleanExpiredTokens() {
  const now = Date.now();
  for (const [ip, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(ip);
    }
  }
}
__name(cleanExpiredTokens, "cleanExpiredTokens");

// src/handlers/whitelist.js
async function handleWhitelist(request, db, env) {
  const url = new URL(request.url);
  const method = request.method;
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token || !db.isValidAdmin(token)) {
    return errorResponse("\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650", 401);
  }
  try {
    switch (method) {
      case "GET":
        return await getWhitelist(db);
      case "POST":
        return await addToWhitelist(request, db);
      case "DELETE":
        return await removeFromWhitelist(request, db);
      default:
        return errorResponse("\u4E0D\u652F\u6301\u7684\u8BF7\u6C42\u65B9\u6CD5", 405);
    }
  } catch (error) {
    console.error("Whitelist API Error:", error);
    return errorResponse("\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF", 500);
  }
}
__name(handleWhitelist, "handleWhitelist");
async function getWhitelist(db) {
  try {
    const whitelist = await db.getWhitelist();
    return successResponse({ whitelist });
  } catch (error) {
    console.error("Get whitelist error:", error);
    return errorResponse("\u83B7\u53D6\u767D\u540D\u5355\u5931\u8D25");
  }
}
__name(getWhitelist, "getWhitelist");
async function addToWhitelist(request, db) {
  try {
    const data = await request.json();
    const { domain, description } = data;
    if (!domain) {
      return errorResponse("\u57DF\u540D\u4E0D\u80FD\u4E3A\u7A7A");
    }
    await db.addToWhitelist(domain, description);
    return successResponse(null, "\u6DFB\u52A0\u6210\u529F");
  } catch (error) {
    console.error("Add to whitelist error:", error);
    return errorResponse("\u6DFB\u52A0\u5931\u8D25");
  }
}
__name(addToWhitelist, "addToWhitelist");
async function removeFromWhitelist(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    if (!id || isNaN(id)) {
      return errorResponse("\u65E0\u6548\u7684ID");
    }
    await db.removeFromWhitelist(parseInt(id));
    return successResponse(null, "\u5220\u9664\u6210\u529F");
  } catch (error) {
    console.error("Remove from whitelist error:", error);
    return errorResponse("\u5220\u9664\u5931\u8D25");
  }
}
__name(removeFromWhitelist, "removeFromWhitelist");

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const db = new DatabaseService(env.DB);
    db.setAdminToken(env.ADMIN_TOKEN);
    if (request.method === "OPTIONS") {
      return corsResponse();
    }
    if (url.pathname.startsWith("/api/comments")) {
      return handleComments(request, db, env, ctx);
    }
    if (url.pathname.startsWith("/api/whitelist")) {
      return handleWhitelist(request, db, env);
    }
    if (url.pathname.startsWith("/api/notifications")) {
      return handleNotifications(request, db, env);
    }
    if (url.pathname === "/admin") {
      return serveAdminPanel(env);
    }
    if (url.pathname === "/api/test") {
      try {
        const testQuery = await db.db.prepare("SELECT 1 as test").first();
        return jsonResponse({ status: "ok", database: "connected", test: testQuery });
      } catch (error) {
        return jsonResponse({ status: "error", message: error.message }, 500);
      }
    }
    if (url.pathname === "/embed.js") {
      return serveEmbedScript(request, env);
    }
    if (url.pathname === "/embed.css") {
      return serveEmbedCSS();
    }
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
    <title>lzreview \u8BC4\u8BBA\u7CFB\u7EDF</title>
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
        <h2>\u{1F389} \u606D\u559C\u4F60\uFF0Clzreview \u8BC4\u8BBA\u7CFB\u7EDF\u5DF2\u90E8\u7F72\u6210\u529F\uFF01</h2>
        <p>\u4F60\u73B0\u5728\u53EF\u4EE5\u4F7F\u7528\u4E0B\u9762\u7684\u65B9\u5F0F\u4E3A\u4F60\u7684\u9759\u6001\u7F51\u7AD9\u6DFB\u52A0\u8BC4\u8BBA\u529F\u80FD\u3002</p>
    </div>

    <h1>lzreview \u8BC4\u8BBA\u7CFB\u7EDF</h1>
    
    <div class="nav-tabs">
        <a href="#" class="nav-tab active" onclick="showTab('test')">\u{1F4DD} \u8BC4\u8BBA\u6D4B\u8BD5</a>
        <a href="#" class="nav-tab" onclick="showTab('guide')">\u{1F4D6} \u4F7F\u7528\u6307\u5357</a>
        <a href="#" class="nav-tab" onclick="showTab('api')">\u{1F527} API\u6587\u6863</a>
    </div>

    <div id="test-content" class="tab-content active">
        <div class="test-section">
            <h2>\u{1F9EA} \u8BC4\u8BBA\u529F\u80FD\u6D4B\u8BD5</h2>
            <p>\u5728\u8FD9\u91CC\u4F60\u53EF\u4EE5\u76F4\u63A5\u6D4B\u8BD5\u8BC4\u8BBA\u7CFB\u7EDF\u7684\u529F\u80FD\uFF0C\u8BD5\u8BD5\u53D1\u5E03\u4E00\u6761\u8BC4\u8BBA\u5427\uFF01</p>
            <button onclick="testDatabase()" style="margin-bottom: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                \u{1F527} \u6D4B\u8BD5\u6570\u636E\u5E93\u8FDE\u63A5
            </button>
            <div id="test-result" style="margin-bottom: 1rem;"></div>
        </div>
        
        <!-- \u8BC4\u8BBA\u6D4B\u8BD5\u5BB9\u5668 -->
        <div id="lzreview-comments"></div>
    </div>

    <div id="guide-content" class="tab-content">
        <h2>\u{1F680} \u5FEB\u901F\u96C6\u6210</h2>
        <p>\u5728\u4F60\u7684\u7F51\u9875\u4E2D\u6DFB\u52A0\u4EE5\u4E0B\u4EE3\u7801\u5373\u53EF\u542F\u7528\u8BC4\u8BBA\u529F\u80FD\uFF1A</p>

        <div class="code">
&lt;!-- \u8BC4\u8BBA\u5BB9\u5668 --&gt;
&lt;div id="lzreview-comments"&gt;&lt;/div&gt;

&lt;!-- \u5F15\u5165\u8BC4\u8BBA\u7CFB\u7EDF --&gt;
&lt;script&gt;
window.lzreviewConfig = {
    apiUrl: '${env.SITE_URL || "your-worker-url.workers.dev"}',
    pageUrl: window.location.href,
    placeholder: '\u8BF4\u70B9\u4EC0\u4E48\u5427...'
};
&lt;/script&gt;
&lt;script src="${env.SITE_URL || "your-worker-url.workers.dev"}/embed.js"&gt;&lt;/script&gt;
        </div>

        <h2>\u2699\uFE0F \u914D\u7F6E\u9009\u9879</h2>
        <p>\u4F60\u53EF\u4EE5\u901A\u8FC7 <code>window.lzreviewConfig</code> \u5BF9\u8C61\u81EA\u5B9A\u4E49\u8BC4\u8BBA\u7CFB\u7EDF\uFF1A</p>
        
        <div class="code">
window.lzreviewConfig = {
    apiUrl: '\u4F60\u7684Worker\u57DF\u540D',           // \u5FC5\u586B\uFF1AAPI\u5730\u5740
    pageUrl: window.location.href,     // \u5FC5\u586B\uFF1A\u5F53\u524D\u9875\u9762URL
    placeholder: '\u8BF4\u70B9\u4EC0\u4E48\u5427...',      // \u53EF\u9009\uFF1A\u8BC4\u8BBA\u6846\u5360\u4F4D\u7B26
    maxLength: 1000,                   // \u53EF\u9009\uFF1A\u8BC4\u8BBA\u6700\u5927\u957F\u5EA6
    requireName: true,                 // \u53EF\u9009\uFF1A\u662F\u5426\u5FC5\u987B\u586B\u5199\u59D3\u540D
    requireEmail: false                // \u53EF\u9009\uFF1A\u662F\u5426\u5FC5\u987B\u586B\u5199\u90AE\u7BB1
};
        </div>
    </div>

    <div id="api-content" class="tab-content">
        <h2>\u{1F6E0} \u7BA1\u7406\u529F\u80FD</h2>
        <p>\u4F7F\u7528\u7BA1\u7406\u5458\u4EE4\u724C\u53EF\u4EE5\u5220\u9664\u8BC4\u8BBA\uFF1A</p>
        <div class="code">
DELETE /api/comments/{id}
Authorization: Bearer your-admin-token
        </div>

        <h2>\u{1F4CA} \u7CFB\u7EDF\u4FE1\u606F</h2>
        <ul>
            <li><strong>\u7248\u672C\uFF1A</strong>1.0.0</li>
            <li><strong>\u6570\u636E\u5E93\uFF1A</strong>Cloudflare D1</li>
            <li><strong>\u8FD0\u884C\u65F6\uFF1A</strong>Cloudflare Workers</li>
            <li><strong>\u90E8\u7F72\u72B6\u6001\uFF1A</strong><span style="color: #28a745;">\u2705 \u6B63\u5E38\u8FD0\u884C</span></li>
        </ul>
    </div>

    <div class="footer">
        <p>\u{1F527} Powered by <strong>lzreview</strong> - \u8F7B\u91CF\u7EA7\u9759\u6001\u7F51\u7AD9\u8BC4\u8BBA\u7CFB\u7EDF</p>
    </div>

    <script>
        // \u6807\u7B7E\u9875\u5207\u6362\u529F\u80FD
        function showTab(tabName) {
            // \u9690\u85CF\u6240\u6709\u6807\u7B7E\u9875\u5185\u5BB9
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // \u79FB\u9664\u6240\u6709\u6807\u7B7E\u9875\u6FC0\u6D3B\u72B6\u6001
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // \u663E\u793A\u9009\u4E2D\u7684\u6807\u7B7E\u9875\u5185\u5BB9
            document.getElementById(tabName + '-content').classList.add('active');
            
            // \u6FC0\u6D3B\u9009\u4E2D\u7684\u6807\u7B7E\u9875
            event.target.classList.add('active');
        }

        // \u6D4B\u8BD5\u6570\u636E\u5E93\u8FDE\u63A5
        async function testDatabase() {
            const resultDiv = document.getElementById('test-result');
            resultDiv.innerHTML = '<p style="color: #666;">\u6B63\u5728\u6D4B\u8BD5\u6570\u636E\u5E93\u8FDE\u63A5...</p>';
            
            try {
                const response = await fetch('/api/test');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    resultDiv.innerHTML = '<p style="color: #28a745;">\u2705 \u6570\u636E\u5E93\u8FDE\u63A5\u6210\u529F\uFF01</p>';
                } else {
                    resultDiv.innerHTML = \`<p style="color: #dc3545;">\u274C \u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25\uFF1A\${data.message}</p>\`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<p style="color: #dc3545;">\u274C \u6D4B\u8BD5\u5931\u8D25\uFF1A\${error.message}</p>\`;
            }
        }

        // \u521D\u59CB\u5316\u8BC4\u8BBA\u7CFB\u7EDF\uFF08\u4EC5\u5728\u6D4B\u8BD5\u6807\u7B7E\u9875\uFF09
        window.lzreviewConfig = {
            apiUrl: window.location.origin,
            pageUrl: window.location.origin + '/#test',
            placeholder: '\u5728\u8FD9\u91CC\u6D4B\u8BD5\u8BC4\u8BBA\u529F\u80FD\uFF0C\u8BD5\u8BD5\u53D1\u5E03\u4E00\u6761\u8BC4\u8BBA\u5427\uFF01',
            maxLength: 1000,
            requireName: true,
            requireEmail: false
        };
    <\/script>
    
    <!-- \u52A0\u8F7D\u8BC4\u8BBA\u7CFB\u7EDF -->
    <script src="/embed.js"><\/script>
</body>
</html>`;
  return htmlResponse(html);
}
__name(serveHomePage, "serveHomePage");
async function serveEmbedScript(request, env) {
  const embedScript2 = await Promise.resolve().then(() => (init_embed(), embed_exports));
  const script = embedScript2.default.replace("{{API_URL}}", env.SITE_URL || new URL(request.url).origin);
  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(serveEmbedScript, "serveEmbedScript");
async function serveEmbedCSS() {
  const embedCSS = await Promise.resolve().then(() => __toESM(require_embed()));
  return new Response(embedCSS.default, {
    headers: {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(serveEmbedCSS, "serveEmbedCSS");
async function serveAdminPanel(env) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>lzreview \u7BA1\u7406\u9762\u677F</title>
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
                <h1>\u{1F6E0} lzreview \u7BA1\u7406\u9762\u677F</h1>
                <p>\u7BA1\u7406\u60A8\u7684\u8BC4\u8BBA\u7CFB\u7EDF</p>
            </div>
            <button id="logout-btn" class="btn btn-danger" style="display: none;">\u9000\u51FA\u767B\u5F55</button>
        </div>

        <div id="login-section" class="login-section">
            <h2>\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u94A5</h2>
            <div id="login-message"></div>
            <form id="login-form">
                <div class="form-group">
                    <label class="form-label" for="admin-token">\u7BA1\u7406\u5458\u5BC6\u94A5</label>
                    <input type="password" id="admin-token" class="form-input" placeholder="\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u94A5" required>
                </div>
                <button type="submit" class="btn">\u767B\u5F55</button>
            </form>
        </div>

        <div id="admin-section" class="admin-section">
            <div class="stats" id="stats-section">
                <div class="stat-card">
                    <div class="stat-number" id="total-comments">-</div>
                    <div class="stat-label">\u603B\u8BC4\u8BBA\u6570</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="today-comments">-</div>
                    <div class="stat-label">\u4ECA\u65E5\u8BC4\u8BBA</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="total-pages">-</div>
                    <div class="stat-label">\u9875\u9762\u6570\u91CF</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="whitelist-count">-</div>
                    <div class="stat-label">\u767D\u540D\u5355\u6570\u91CF</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('pages')">\u9875\u9762\u7BA1\u7406</button>
                <button class="tab" onclick="showTab('comments')">\u8BC4\u8BBA\u7BA1\u7406</button>
                <button class="tab" onclick="showTab('whitelist')">\u767D\u540D\u5355\u7BA1\u7406</button>
                <button class="tab" onclick="showTab('notifications')">\u901A\u77E5\u63A8\u9001</button>
            </div>

            <div id="pages-content" class="tab-content active">
                <div class="card">
                    <h3>\u9875\u9762\u7BA1\u7406</h3>
                    <div id="admin-message"></div>
                    <div id="pages-loading" class="loading">\u6B63\u5728\u52A0\u8F7D\u9875\u9762...</div>
                    <div id="pages-list" class="page-list"></div>
                </div>
            </div>

            <div id="comments-content" class="tab-content">
                <div class="card">
                    <h3>\u8BC4\u8BBA\u7BA1\u7406</h3>
                    <div class="batch-actions">
                        <input type="checkbox" id="select-all" onchange="toggleSelectAll()">
                        <label for="select-all">\u5168\u9009</label>
                        <button class="btn btn-danger" onclick="batchDelete()">\u6279\u91CF\u5220\u9664</button>
                        <select id="page-filter" class="form-select" onchange="filterComments()" style="width: 300px; display: inline-block;">
                            <option value="">\u6240\u6709\u9875\u9762</option>
                        </select>
                    </div>
                    <div id="comments-loading" class="loading">\u6B63\u5728\u52A0\u8F7D\u8BC4\u8BBA...</div>
                    <table id="comments-table" class="comments-table" style="display: none;">
                        <thead>
                            <tr>
                                <th width="50">\u9009\u62E9</th>
                                <th>ID</th>
                                <th>\u9875\u9762</th>
                                <th>\u4F5C\u8005</th>
                                <th>\u5185\u5BB9</th>
                                <th>\u65F6\u95F4</th>
                                <th>\u64CD\u4F5C</th>
                            </tr>
                        </thead>
                        <tbody id="comments-tbody">
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="whitelist-content" class="tab-content">
                <div class="card">
                    <h3>\u767D\u540D\u5355\u7BA1\u7406</h3>
                    <div class="form-group">
                        <button class="btn btn-success" onclick="showAddWhitelistModal()">\u6DFB\u52A0\u57DF\u540D</button>
                    </div>
                    <div id="whitelist-loading" class="loading">\u6B63\u5728\u52A0\u8F7D\u767D\u540D\u5355...</div>
                    <div id="whitelist-list"></div>
                </div>
            </div>

            <div id="notifications-content" class="tab-content">
                <div class="card">
                    <h3>\u901A\u77E5\u63A8\u9001\u914D\u7F6E</h3>
                    <div id="notification-status" class="alert" style="display: none;"></div>
                    
                    <!-- \u63A8\u9001\u5668\u72B6\u6001 -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>\u63A8\u9001\u5668\u72B6\u6001</h4>
                        <div id="notifiers-status">
                            <div class="loading">\u6B63\u5728\u68C0\u67E5\u63A8\u9001\u5668\u72B6\u6001...</div>
                        </div>
                    </div>

                    <!-- \u90AE\u7BB1\u63A8\u9001\u914D\u7F6E -->
                    <div class="card">
                        <h4>\u90AE\u7BB1\u63A8\u9001\u914D\u7F6E</h4>
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #007cba;">
                            <h5 style="margin: 0 0 10px 0; color: #007cba;">\u{1F4E7} \u90AE\u7BB1\u63A8\u9001\u529F\u80FD\u8BF4\u660E</h5>
                            <p style="margin: 0; color: #333; line-height: 1.5;">
                                <strong>\u7BA1\u7406\u5458\u90AE\u7BB1</strong>\uFF1A\u5F53\u7F51\u7AD9\u6709\u65B0\u8BC4\u8BBA\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u53D1\u9001\u90AE\u4EF6\u901A\u77E5\u5230\u8FD9\u4E9B\u90AE\u7BB1\uFF0C\u8BA9\u4F60\u53CA\u65F6\u4E86\u89E3\u8BC4\u8BBA\u52A8\u6001\u3002<br>
                                <strong>\u7528\u9014</strong>\uFF1A\u9002\u5408\u7F51\u7AD9\u7BA1\u7406\u5458\u3001\u535A\u4E3B\u7B49\u9700\u8981\u53CA\u65F6\u54CD\u5E94\u8BC4\u8BBA\u7684\u4EBA\u5458\u3002<br>
                                <strong>\u683C\u5F0F</strong>\uFF1A\u652F\u6301\u591A\u4E2A\u90AE\u7BB1\uFF0C\u7528\u9017\u53F7\u5206\u9694\uFF0C\u5982\uFF1Aadmin@example.com, blogger@example.com
                            </p>
                        </div>
                        
                        <form id="email-notification-form">
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="email-enabled"> \u542F\u7528\u90AE\u7BB1\u63A8\u9001
                                </label>
                                <small style="color: #666; display: block; margin-top: 5px;">
                                    \u52FE\u9009\u540E\uFF0C\u6BCF\u5F53\u6709\u65B0\u8BC4\u8BBA\u53D1\u5E03\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u53D1\u9001\u90AE\u4EF6\u901A\u77E5
                                </small>
                            </div>
                            
                            <div id="email-config" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label" for="admin-emails">
                                        \u{1F4EE} \u7BA1\u7406\u5458\u90AE\u7BB1\u5730\u5740 
                                        <span style="color: #dc3545;">*</span>
                                    </label>
                                    <input type="text" id="admin-emails" class="form-input" 
                                           placeholder="your-email@qq.com, admin@gmail.com" 
                                           style="margin-bottom: 5px;">
                                    <small style="color: #666; line-height: 1.4;">
                                        \u{1F4A1} <strong>\u4F5C\u7528</strong>\uFF1A\u5F53\u6709\u65B0\u8BC4\u8BBA\u65F6\uFF0C\u8FD9\u4E9B\u90AE\u7BB1\u4F1A\u6536\u5230\u901A\u77E5\u90AE\u4EF6<br>
                                        \u{1F4A1} <strong>\u683C\u5F0F</strong>\uFF1A\u591A\u4E2A\u90AE\u7BB1\u7528\u9017\u53F7\u5206\u9694<br>
                                        \u{1F4A1} <strong>\u5EFA\u8BAE</strong>\uFF1A\u586B\u5199\u4F60\u7ECF\u5E38\u67E5\u770B\u7684\u90AE\u7BB1\uFF0C\u5982QQ\u90AE\u7BB1\u3001Gmail\u7B49
                                    </small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="include-page-info" checked> \u5728\u90AE\u4EF6\u4E2D\u5305\u542B\u9875\u9762\u4FE1\u606F
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="include-comment-content" checked> \u5728\u90AE\u4EF6\u4E2D\u5305\u542B\u8BC4\u8BBA\u5185\u5BB9
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn">\u4FDD\u5B58\u914D\u7F6E</button>
                                <button type="button" class="btn btn-secondary" onclick="testEmailNotification()">\u6D4B\u8BD5\u90AE\u4EF6\u53D1\u9001</button>
                            </div>
                        </form>
                    </div>

                    <!-- Telegram\u63A8\u9001\u914D\u7F6E -->
                    <div class="card">
                        <h4>Telegram\u63A8\u9001\u914D\u7F6E</h4>
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                            <h5 style="margin: 0 0 10px 0; color: #28a745;">\u{1F4F1} Telegram\u63A8\u9001\u529F\u80FD\u8BF4\u660E</h5>
                            <p style="margin: 0; color: #333; line-height: 1.5;">
                                <strong>Chat ID</strong>\uFF1A\u5F53\u7F51\u7AD9\u6709\u65B0\u8BC4\u8BBA\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u53D1\u9001\u6D88\u606F\u5230\u6307\u5B9A\u7684Telegram\u804A\u5929\uFF0C\u8BA9\u4F60\u53CA\u65F6\u4E86\u89E3\u8BC4\u8BBA\u52A8\u6001\u3002<br>
                                <strong>\u7528\u9014</strong>\uFF1A\u9002\u5408\u5E0C\u671B\u901A\u8FC7Telegram\u5373\u65F6\u63A5\u6536\u901A\u77E5\u7684\u7528\u6237\uFF0C\u652F\u6301\u4E2A\u4EBA\u3001\u7FA4\u7EC4\u548C\u9891\u9053\u3002<br>
                                <strong>\u914D\u7F6E</strong>\uFF1A\u9700\u8981\u5148\u521B\u5EFATelegram\u673A\u5668\u4EBA\u5E76\u83B7\u53D6Chat ID\uFF0C\u8BE6\u89C1 <a href="/TELEGRAM_SETUP.md" target="_blank">\u914D\u7F6E\u6307\u5357</a>
                            </p>
                        </div>
                        
                        <form id="telegram-notification-form">
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="telegram-enabled"> \u542F\u7528Telegram\u63A8\u9001
                                </label>
                                <small style="color: #666; display: block; margin-top: 5px;">
                                    \u52FE\u9009\u540E\uFF0C\u6BCF\u5F53\u6709\u65B0\u8BC4\u8BBA\u53D1\u5E03\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u53D1\u9001Telegram\u6D88\u606F\u901A\u77E5
                                </small>
                            </div>
                            
                            <div id="telegram-config" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label" for="telegram-chat-ids">
                                        \u{1F4AC} \u63A5\u6536\u901A\u77E5\u7684Chat ID 
                                        <span style="color: #dc3545;">*</span>
                                    </label>
                                    <input type="text" id="telegram-chat-ids" class="form-input" 
                                           placeholder="123456789, -987654321, @your_channel" 
                                           style="margin-bottom: 5px;">
                                    <small style="color: #666; line-height: 1.4;">
                                        \u{1F4A1} <strong>\u683C\u5F0F</strong>\uFF1A\u591A\u4E2AChat ID\u7528\u9017\u53F7\u5206\u9694<br>
                                        \u{1F4A1} <strong>\u4E2A\u4EBA\u804A\u5929</strong>\uFF1A\u6B63\u6570\uFF0C\u5982 123456789<br>
                                        \u{1F4A1} <strong>\u7FA4\u7EC4\u804A\u5929</strong>\uFF1A\u8D1F\u6570\uFF0C\u5982 -987654321<br>
                                        \u{1F4A1} <strong>\u516C\u5F00\u9891\u9053</strong>\uFF1A@\u7528\u6237\u540D\uFF0C\u5982 @your_channel<br>
                                        \u{1F4A1} <strong>\u83B7\u53D6\u65B9\u6CD5</strong>\uFF1A\u67E5\u770B <a href="/TELEGRAM_SETUP.md" target="_blank">\u914D\u7F6E\u6307\u5357</a>
                                    </small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="telegram-include-page-info" checked> \u5728\u6D88\u606F\u4E2D\u5305\u542B\u9875\u9762\u4FE1\u606F
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="telegram-include-comment-content" checked> \u5728\u6D88\u606F\u4E2D\u5305\u542B\u8BC4\u8BBA\u5185\u5BB9
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn">\u4FDD\u5B58\u914D\u7F6E</button>
                                <button type="button" class="btn btn-secondary" onclick="testTelegramNotification()">\u6D4B\u8BD5Telegram\u63A8\u9001</button>
                            </div>
                        </form>
                    </div>

                    <!-- \u8BA2\u9605\u8005\u7BA1\u7406 -->
                    <div class="card">
                        <h4>\u90AE\u4EF6\u8BA2\u9605\u8005\u7BA1\u7406</h4>
                        <div id="subscribers-loading" class="loading" style="display: none;">\u6B63\u5728\u52A0\u8F7D\u8BA2\u9605\u8005...</div>
                        <div id="subscribers-list"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- \u6DFB\u52A0\u767D\u540D\u5355\u6A21\u6001\u6846 -->
        <div id="whitelist-modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h3>\u6DFB\u52A0\u57DF\u540D\u5230\u767D\u540D\u5355</h3>
                <form id="whitelist-form">
                    <div class="form-group">
                        <label class="form-label" for="domain">\u57DF\u540D</label>
                        <input type="text" id="domain" class="form-input" placeholder="example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="description">\u63CF\u8FF0</label>
                        <input type="text" id="description" class="form-input" placeholder="\u53EF\u9009\u63CF\u8FF0">
                    </div>
                    <button type="submit" class="btn">\u6DFB\u52A0</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        let adminToken = '';
        let allComments = [];
        let currentPageUrl = '';
        const apiUrl = window.location.origin;

        // \u767B\u5F55\u5904\u7406
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('admin-token').value.trim();
            
            if (!token) {
                showLoginMessage('\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u94A5', 'error');
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
                showLoginMessage('\u5BC6\u94A5\u9A8C\u8BC1\u5931\u8D25', 'error');
                adminToken = '';
            }
        });

        // \u9000\u51FA\u767B\u5F55
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
                        <div class="page-title">\${page.title || '\u65E0\u6807\u9898'}</div>
                        <div class="page-url">\${page.page_url}</div>
                        <div class="page-stats">
                            <span class="page-stat">\u8BC4\u8BBA\u6570: \${page.comment_count}</span>
                            <span class="page-stat">\u6700\u65B0: \${formatDate(page.latest_comment)}</span>
                        </div>
                        <div class="page-actions">
                            <button class="btn" onclick="viewPageComments('\${page.page_url}')">\u67E5\u770B\u8BC4\u8BBA</button>
                            <button class="btn btn-danger" onclick="deletePageComments('\${page.page_url}')">\u5220\u9664\u6240\u6709\u8BC4\u8BBA</button>
                        </div>
                    </div>
                \`).join('');

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('\u52A0\u8F7D\u9875\u9762\u5931\u8D25', 'error');
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
                
                // \u586B\u5145\u9875\u9762\u8FC7\u6EE4\u5668
                const pageFilter = document.getElementById('page-filter');
                const pages = [...new Set(allComments.map(c => c.page_url))];
                pageFilter.innerHTML = '<option value="">\u6240\u6709\u9875\u9762</option>' + 
                    pages.map(url => \`<option value="\${url}">\${truncate(url, 50)}</option>\`).join('');
                
                renderComments(allComments);
                loadingEl.style.display = 'none';
                tableEl.style.display = 'table';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('\u52A0\u8F7D\u8BC4\u8BBA\u5931\u8D25', 'error');
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
                        <button class="btn btn-danger" onclick="deleteComment(\${comment.id})">\u5220\u9664</button>
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
                showAdminMessage('\u8BF7\u9009\u62E9\u8981\u5220\u9664\u7684\u8BC4\u8BBA', 'error');
                return;
            }

            if (!confirm(\`\u786E\u5B9A\u8981\u5220\u9664 \${selectedIds.length} \u6761\u8BC4\u8BBA\u5417\uFF1F\`)) {
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
                    showAdminMessage('\u6279\u91CF\u5220\u9664\u6210\u529F', 'success');
                    await loadComments();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '\u6279\u91CF\u5220\u9664\u5931\u8D25', 'error');
                }
            } catch (error) {
                showAdminMessage('\u6279\u91CF\u5220\u9664\u5931\u8D25', 'error');
            }
        }

        async function deleteComment(commentId) {
            if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u8BC4\u8BBA\u5417\uFF1F')) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/comments/\${commentId}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('\u8BC4\u8BBA\u5220\u9664\u6210\u529F', 'success');
                    await loadComments();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '\u5220\u9664\u5931\u8D25', 'error');
                }
            } catch (error) {
                showAdminMessage('\u5220\u9664\u5931\u8D25', 'error');
            }
        }

        async function deletePageComments(pageUrl) {
            if (!confirm(\`\u786E\u5B9A\u8981\u5220\u9664\u9875\u9762 "\${pageUrl}" \u7684\u6240\u6709\u8BC4\u8BBA\u5417\uFF1F\`)) return;

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
                    showAdminMessage('\u9875\u9762\u8BC4\u8BBA\u5220\u9664\u6210\u529F', 'success');
                    await loadPages();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '\u5220\u9664\u5931\u8D25', 'error');
                }
            } catch (error) {
                showAdminMessage('\u5220\u9664\u5931\u8D25', 'error');
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
                        <button class="btn btn-danger" onclick="removeFromWhitelist(\${item.id})">\u5220\u9664</button>
                    </div>
                \`).join('');

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                showAdminMessage('\u52A0\u8F7D\u767D\u540D\u5355\u5931\u8D25', 'error');
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
                    showAdminMessage('\u6DFB\u52A0\u6210\u529F', 'success');
                    closeModal();
                    await loadWhitelist();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '\u6DFB\u52A0\u5931\u8D25', 'error');
                }
            } catch (error) {
                showAdminMessage('\u6DFB\u52A0\u5931\u8D25', 'error');
            }
        });

        async function removeFromWhitelist(id) {
            if (!confirm('\u786E\u5B9A\u8981\u4ECE\u767D\u540D\u5355\u4E2D\u5220\u9664\u5417\uFF1F')) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/whitelist/\${id}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showAdminMessage('\u5220\u9664\u6210\u529F', 'success');
                    await loadWhitelist();
                    await loadStats();
                } else {
                    showAdminMessage(data.message || '\u5220\u9664\u5931\u8D25', 'error');
                }
            } catch (error) {
                showAdminMessage('\u5220\u9664\u5931\u8D25', 'error');
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

        // \u901A\u77E5\u8BBE\u7F6E\u76F8\u5173\u51FD\u6570
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
                                \${info.configured ? '\u2705 \u5DF2\u914D\u7F6E' : '\u274C \u672A\u914D\u7F6E'}
                            </span>
                            \${!info.configured ? \`<br><small style="color: #666;">\u9700\u8981: \${info.requiredEnvVars.join(', ')}</small>\` : ''}
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                statusEl.innerHTML = '<p style="color: #dc3545;">\u52A0\u8F7D\u63A8\u9001\u5668\u72B6\u6001\u5931\u8D25</p>';
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
                
                // \u586B\u5145\u90AE\u7BB1\u914D\u7F6E
                const emailConfig = config.email || {};
                document.getElementById('email-enabled').checked = emailConfig.enabled || false;
                document.getElementById('admin-emails').value = (emailConfig.recipients || []).join(', ');
                document.getElementById('include-page-info').checked = emailConfig.includePageInfo !== false;
                document.getElementById('include-comment-content').checked = emailConfig.includeCommentContent !== false;
                
                toggleEmailConfig();

                // \u52A0\u8F7DTelegram\u914D\u7F6E
                const telegramConfig = config.telegram || {};
                document.getElementById('telegram-enabled').checked = telegramConfig.enabled || false;
                document.getElementById('telegram-chat-ids').value = (telegramConfig.chatIds || []).join(', ');
                document.getElementById('telegram-include-page-info').checked = telegramConfig.includePageInfo !== false;
                document.getElementById('telegram-include-comment-content').checked = telegramConfig.includeCommentContent !== false;
                
                toggleTelegramConfig();
            } catch (error) {
                console.error('\u52A0\u8F7D\u901A\u77E5\u914D\u7F6E\u5931\u8D25:', error);
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

        // \u7ED1\u5B9A\u90AE\u7BB1\u542F\u7528\u590D\u9009\u6846\u4E8B\u4EF6
        document.getElementById('email-enabled').addEventListener('change', toggleEmailConfig);

        // \u7ED1\u5B9ATelegram\u542F\u7528\u590D\u9009\u6846\u4E8B\u4EF6
        document.getElementById('telegram-enabled').addEventListener('change', toggleTelegramConfig);

        // \u7ED1\u5B9A\u90AE\u7BB1\u914D\u7F6E\u8868\u5355\u63D0\u4EA4\u4E8B\u4EF6
        document.getElementById('email-notification-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveNotificationConfig();
        });

        // \u7ED1\u5B9ATelegram\u914D\u7F6E\u8868\u5355\u63D0\u4EA4\u4E8B\u4EF6
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
                        subscribers: [], // \u4FDD\u6301\u73B0\u6709\u8BA2\u9605\u8005
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
                    showNotificationMessage('\u901A\u77E5\u914D\u7F6E\u4FDD\u5B58\u6210\u529F', 'success');
                } else {
                    showNotificationMessage(data.message || '\u4FDD\u5B58\u5931\u8D25', 'error');
                }
            } catch (error) {
                showNotificationMessage('\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25', 'error');
            }
        }

        async function testEmailNotification() {
            const testEmail = prompt('\u8BF7\u8F93\u5165\u6D4B\u8BD5\u90AE\u7BB1\u5730\u5740:');
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
                    showNotificationMessage(\`\u6D4B\u8BD5\u90AE\u4EF6\u5DF2\u53D1\u9001\u5230 \${testEmail}\`, 'success');
                } else {
                    showNotificationMessage(data.message || '\u6D4B\u8BD5\u5931\u8D25', 'error');
                }
            } catch (error) {
                showNotificationMessage('\u6D4B\u8BD5\u90AE\u4EF6\u53D1\u9001\u5931\u8D25', 'error');
            }
        }

        async function testTelegramNotification() {
            const testChatId = prompt('\u8BF7\u8F93\u5165\u6D4B\u8BD5Chat ID:');
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
                    showNotificationMessage(\`\u6D4B\u8BD5\u6D88\u606F\u5DF2\u53D1\u9001\u5230 Chat ID: \${testChatId}\`, 'success');
                } else {
                    showNotificationMessage(data.message || '\u6D4B\u8BD5\u5931\u8D25', 'error');
                }
            } catch (error) {
                showNotificationMessage('\u6D4B\u8BD5Telegram\u63A8\u9001\u5931\u8D25', 'error');
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
                    listEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">\u6682\u65E0\u90AE\u4EF6\u8BA2\u9605\u8005</p>';
                } else {
                    listEl.innerHTML = subscribers.map(subscriber => \`
                        <div class="whitelist-item">
                            <div>
                                <strong>\${subscriber.email}</strong>
                                \${subscriber.name && subscriber.name !== subscriber.email.split('@')[0] ? \`<br><small>\${subscriber.name}</small>\` : ''}
                                \${subscriber.page_url ? \`<br><small>\u9875\u9762: \${subscriber.page_url}</small>\` : ''}
                                <br><small>\u8BA2\u9605\u65F6\u95F4: \${formatDate(subscriber.subscribed_at)}</small>
                            </div>
                            <button class="btn btn-danger" onclick="removeEmailSubscriber('\${subscriber.email}')">\u5220\u9664</button>
                        </div>
                    \`).join('');
                }

                loadingEl.style.display = 'none';
            } catch (error) {
                loadingEl.style.display = 'none';
                listEl.innerHTML = '<p style="color: #dc3545;">\u52A0\u8F7D\u8BA2\u9605\u8005\u5931\u8D25</p>';
            }
        }

        async function removeEmailSubscriber(email) {
            if (!confirm(\`\u786E\u5B9A\u8981\u5220\u9664\u8BA2\u9605\u8005 \${email} \u5417\uFF1F\`)) return;

            try {
                const response = await fetch(\`\${apiUrl}/api/notifications/subscribe/\${encodeURIComponent(email)}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });

                const data = await response.json();
                if (data.success) {
                    showNotificationMessage('\u8BA2\u9605\u8005\u5220\u9664\u6210\u529F', 'success');
                    await loadEmailSubscribers();
                } else {
                    showNotificationMessage(data.message || '\u5220\u9664\u5931\u8D25', 'error');
                }
            } catch (error) {
                showNotificationMessage('\u5220\u9664\u8BA2\u9605\u8005\u5931\u8D25', 'error');
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
    <\/script>
</body>
</html>`;
  return htmlResponse(html);
}
__name(serveAdminPanel, "serveAdminPanel");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
