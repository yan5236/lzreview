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
var require_ = __commonJS({
  "src/web/embed.css"(exports, module) {
    module.exports = {};
  }
});

// src/database/db.js
var DatabaseService = class {
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
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*$/;
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
};
__name(DatabaseService, "DatabaseService");

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
  if (typeof str !== "string")
    return false;
  const dangerousChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF]/;
  return dangerousChars.test(str);
}
__name(containsControlCharacters, "containsControlCharacters");
function sanitizeInput(input) {
  if (typeof input !== "string")
    return input;
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
  if (typeof text !== "string")
    return false;
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
    if (lowerText.includes(word))
      return true;
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
  if (!error)
    return "\u672A\u77E5\u9519\u8BEF";
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

// src/handlers/comments.js
var cache = /* @__PURE__ */ new Map();
var csrfTokens = /* @__PURE__ */ new Map();
async function handleComments(request, db, env) {
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
        return await createComment(request, db);
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
async function createComment(request, db) {
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
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const db = new DatabaseService(env.DB);
    db.setAdminToken(env.ADMIN_TOKEN);
    if (request.method === "OPTIONS") {
      return corsResponse();
    }
    if (url.pathname.startsWith("/api/comments")) {
      return handleComments(request, db, env);
    }
    if (url.pathname.startsWith("/api/whitelist")) {
      return handleWhitelist(request, db, env);
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
  const embedCSS = await Promise.resolve().then(() => __toESM(require_()));
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
    <\/script>
</body>
</html>`;
  return htmlResponse(html);
}
__name(serveAdminPanel, "serveAdminPanel");
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
