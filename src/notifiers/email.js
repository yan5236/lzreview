/**
 * 邮箱通知推送器
 * 使用 Resend API 发送邮件
 */
export class EmailNotifier {
  constructor(config) {
    this.config = {
      apiKey: config.apiKey,
      fromName: config.fromName || 'lzreview评论系统',
      fromEmail: config.fromEmail || 'notifications@example.com',
      apiUrl: 'https://api.resend.com/emails'
    };
  }

  /**
   * 发送新评论通知邮件
   */
  async sendNewCommentNotification(commentData, emailConfig) {
    console.log('📮 EmailNotifier: 开始发送新评论通知邮件');
    console.log('📮 邮件配置:', emailConfig);
    console.log('📮 API Key 配置:', this.config.apiKey ? '✅ 已配置' : '❌ 未配置');
    
    try {
      const allRecipients = [
        ...(emailConfig.recipients || []),
        ...(emailConfig.subscribers || [])
      ];

      console.log('📮 收件人列表:', allRecipients);

      if (allRecipients.length === 0) {
        console.log('❌ 没有配置收件人');
        return {
          success: false,
          message: '没有配置收件人'
        };
      }

      console.log('📮 生成邮件内容...');
      const emailContent = this.generateEmailContent(commentData, emailConfig);
      console.log('📮 邮件主题:', emailContent.subject);
      
      const results = [];

      // 为了避免被标记为垃圾邮件，我们逐个发送邮件
      console.log('📮 开始逐个发送邮件...');
      for (const recipient of allRecipients) {
        try {
          console.log(`📮 发送邮件到: ${recipient}`);
          const result = await this.sendEmail(recipient, emailContent);
          console.log(`📮 发送结果 [${recipient}]:`, result);
          
          results.push({
            recipient,
            success: result.success,
            message: result.message
          });
        } catch (error) {
          console.log(`❌ 发送失败 [${recipient}]:`, error.message);
          results.push({
            recipient,
            success: false,
            message: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `邮件发送完成: ${successCount}/${totalCount} 成功`,
        details: results
      };

    } catch (error) {
      console.error('邮件通知发送失败:', error);
      return {
        success: false,
        message: `邮件发送失败: ${error.message}`
      };
    }
  }

  /**
   * 生成邮件内容
   */
  generateEmailContent(commentData, emailConfig) {
    const isReply = commentData.isReply;
    const subject = isReply 
      ? `新回复通知 - ${commentData.pageTitle}`
      : `新评论通知 - ${commentData.pageTitle}`;

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
    const actionText = isReply ? '回复了评论' : '发表了新评论';
    const typeText = isReply ? '回复' : '评论';

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${typeText}通知</title>
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
            background: ${isReply ? '#28a745' : '#007cba'};
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
            border-left: 4px solid ${isReply ? '#28a745' : '#007cba'};
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
            <h1>📧 lzreview</h1>
            <p>评论系统通知</p>
        </div>

        <div class="notification-type">
            ${isReply ? '💬 新回复' : '🔔 新评论'}
        </div>

        ${emailConfig.includePageInfo !== false ? `
        <div class="page-info">
            <div class="page-title">📄 ${commentData.pageTitle}</div>
            <div class="page-url">${commentData.pageUrl}</div>
        </div>
        ` : ''}

        <div class="comment-info">
            <div class="author-info">
                <div class="author-avatar">
                    ${commentData.authorName.charAt(0).toUpperCase()}
                </div>
                <div class="author-details">
                    <h3>${commentData.authorName}</h3>
                    <p>${actionText} • <span class="timestamp">${this.formatDate(commentData.createdAt)}</span></p>
                </div>
            </div>

            ${emailConfig.includeCommentContent !== false ? `
            <div class="comment-content">${commentData.content}</div>
            ` : `
            <p style="color: #666; font-style: italic;">内容已隐藏，请前往页面查看完整${typeText}</p>
            `}
        </div>

        <div class="actions">
            <a href="${commentData.pageUrl}#comment-${commentData.id}" class="btn">
                查看${typeText}
            </a>
            <a href="${commentData.pageUrl}" class="btn btn-secondary">
                访问页面
            </a>
        </div>

        <div class="footer">
            <p>这是来自 lzreview 评论系统的自动通知</p>
            <p>如不想接收此类邮件，请联系网站管理员</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                邮件发送时间: ${this.formatDate(new Date())}
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
    const actionText = isReply ? '回复了评论' : '发表了新评论';
    const typeText = isReply ? '回复' : '评论';

    let content = `
lzreview 评论系统通知

${isReply ? '💬 新回复' : '🔔 新评论'}

`;

    if (emailConfig.includePageInfo !== false) {
      content += `页面: ${commentData.pageTitle}
URL: ${commentData.pageUrl}

`;
    }

    content += `${commentData.authorName} ${actionText}
时间: ${this.formatDate(commentData.createdAt)}

`;

    if (emailConfig.includeCommentContent !== false) {
      content += `${typeText}内容:
${commentData.content}

`;
    } else {
      content += `内容已隐藏，请前往页面查看完整${typeText}

`;
    }

    content += `查看${typeText}: ${commentData.pageUrl}#comment-${commentData.id}
访问页面: ${commentData.pageUrl}

---
这是来自 lzreview 评论系统的自动通知
如不想接收此类邮件，请联系网站管理员

邮件发送时间: ${this.formatDate(new Date())}
    `;

    return content.trim();
  }

  /**
   * 发送邮件 (使用 Resend API)
   */
  async sendEmail(recipient, content) {
    console.log(`📮 sendEmail 开始 - 收件人: ${recipient}`);
    
    try {
      if (!this.config.apiKey) {
        throw new Error('Resend API Key 未配置');
      }

      const emailData = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [recipient],
        subject: content.subject,
        html: content.html,
        text: content.text
      };

      console.log(`📮 准备发送邮件数据:`, {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        apiUrl: this.config.apiUrl
      });

      // 创建 AbortController 用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`📮 请求超时，正在中止请求...`);
        controller.abort();
      }, 30000); // 30秒超时

      console.log(`📮 开始发送 HTTP 请求到 Resend API...`);
      
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData),
        signal: controller.signal
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      console.log(`📮 HTTP 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(`📮 API 错误响应:`, errorData);
        throw new Error(`Resend API 错误: ${response.status} - ${errorData.message || response.statusText}`);
      }

      console.log(`📮 开始解析响应 JSON...`);
      const result = await response.json();
      console.log(`📮 API 响应结果:`, result);
      
      console.log(`📮 邮件发送成功 - Message ID: ${result.id}`);
      return {
        success: true,
        message: '邮件发送成功',
        messageId: result.id
      };

    } catch (error) {
      console.error('📮 邮件发送失败:', error);
      
      // 详细的错误分类
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = '请求超时 - Resend API 响应时间过长';
      } else if (error.message.includes('fetch')) {
        errorMessage = '网络请求失败 - 无法连接到 Resend API';
      }
      
      console.log(`📮 错误类型: ${error.name}, 错误消息: ${errorMessage}`);
      
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
        subject: '🧪 lzreview 邮件推送测试',
        html: this.generateTestEmailHTML(),
        text: this.generateTestEmailText()
      };

      const result = await this.sendEmail(testEmail, testContent);
      
      return {
        success: result.success,
        message: result.success 
          ? `测试邮件已发送到 ${testEmail}` 
          : `测试邮件发送失败: ${result.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: `邮件推送测试失败: ${error.message}`
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
    <title>邮件推送测试</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .test-header { background: #007cba; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .test-content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>🧪 lzreview 邮件推送测试</h1>
        <p>如果您收到这封邮件，说明邮件推送功能正常工作</p>
    </div>
    
    <div class="test-content">
        <p><span class="success-badge">✅ 测试成功</span></p>
        <p><strong>测试时间:</strong> ${this.formatDate(new Date())}</p>
        <p><strong>发送方:</strong> ${this.config.fromName} &lt;${this.config.fromEmail}&gt;</p>
        <p><strong>邮件服务:</strong> Resend API</p>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center;">
        这是来自 lzreview 评论系统的测试邮件
    </p>
</body>
</html>`;
  }

  /**
   * 生成测试邮件文本内容
   */
  generateTestEmailText() {
    return `
lzreview 邮件推送测试

✅ 如果您收到这封邮件，说明邮件推送功能正常工作

测试信息:
- 测试时间: ${this.formatDate(new Date())}
- 发送方: ${this.config.fromName} <${this.config.fromEmail}>
- 邮件服务: Resend API

这是来自 lzreview 评论系统的测试邮件
    `;
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}