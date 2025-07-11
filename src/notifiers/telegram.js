/**
 * Telegram 通知推送器
 * 使用 Telegram Bot API 发送消息
 */
export class TelegramNotifier {
  constructor(config) {
    console.log('📱 初始化 TelegramNotifier，配置:', { 
      hasBotToken: !!config.botToken,
      parseMode: '纯文本模式'
    });
    
    this.config = {
      botToken: config.botToken,
      apiUrl: config.botToken ? `https://api.telegram.org/bot${config.botToken}` : null,
      parseMode: config.parseMode || 'Markdown'
    };
    
    if (!this.config.botToken) {
      console.log('⚠️ Telegram Bot Token 未配置，通知功能将不可用');
    } else {
      console.log('✅ Telegram Bot Token 已配置，API URL:', this.config.apiUrl);
    }
  }

  /**
   * 发送新评论通知到 Telegram
   */
  async sendNewCommentNotification(commentData, telegramConfig) {
    console.log('📱 TelegramNotifier: 开始发送新评论通知');
    console.log('📱 Telegram配置:', telegramConfig);
    console.log('📱 Bot Token 配置:', this.config.botToken ? '✅ 已配置' : '❌ 未配置');
    
    try {
      const chatIds = telegramConfig.chatIds || [];
      
      console.log('📱 接收者Chat ID列表:', chatIds);

      if (chatIds.length === 0) {
        console.log('❌ 没有配置接收者Chat ID');
        return {
          success: false,
          message: '没有配置接收者Chat ID'
        };
      }

      console.log('📱 生成消息内容...');
      const messageContent = this.generateMessageContent(commentData, telegramConfig);
      console.log('📱 消息内容长度:', messageContent.length);
      
      const results = [];

      // 逐个发送消息到不同的chat
      console.log('📱 开始逐个发送消息...');
      for (const chatId of chatIds) {
        try {
          console.log(`📱 发送消息到Chat ID: ${chatId}`);
          const result = await this.sendMessage(chatId, messageContent);
          console.log(`📱 发送结果 [${chatId}]:`, result);
          
          results.push({
            chatId,
            success: result.success,
            message: result.message
          });
        } catch (error) {
          console.log(`❌ 发送失败 [${chatId}]:`, error.message);
          results.push({
            chatId,
            success: false,
            message: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `Telegram消息发送完成: ${successCount}/${totalCount} 成功`,
        details: results
      };

    } catch (error) {
      console.error('Telegram通知发送失败:', error);
      return {
        success: false,
        message: `Telegram发送失败: ${error.message}`
      };
    }
  }

  /**
   * 生成Telegram消息内容
   */
  generateMessageContent(commentData, telegramConfig) {
    const isReply = commentData.isReply;
    const actionText = isReply ? '回复了评论' : '发表了新评论';
    const typeText = isReply ? '回复' : '评论';
    const emoji = isReply ? '💬' : '🔔';

    // 构建消息内容 - 使用纯文本格式
    let message = `${emoji} 新${typeText}通知\n\n`;

    // 页面信息
    if (telegramConfig.includePageInfo !== false) {
      message += `📄 页面: ${commentData.pageTitle}\n`;
      message += `🔗 链接: ${commentData.pageUrl}\n\n`;
    }

    // 作者信息
    message += `👤 作者: ${commentData.authorName}\n`;
    message += `⏰ 时间: ${this.formatDate(commentData.createdAt)}\n\n`;

    // 评论内容
    if (telegramConfig.includeCommentContent !== false) {
      const content = this.truncateText(commentData.content, 500);
      message += `💭 ${typeText}内容:\n`;
      message += `${content}\n\n`;
    } else {
      message += `💭 内容已隐藏，请前往页面查看完整${typeText}\n\n`;
    }

    // 操作链接
    message += `🔗 查看${typeText}: ${commentData.pageUrl}#comment-${commentData.id}\n`;
    message += `📖 访问页面: ${commentData.pageUrl}`;

    return message;
  }

  /**
   * 发送消息到指定的 Chat ID (带重试机制)
   */
  async sendMessage(chatId, message) {
    console.log(`📱 sendMessage 开始 - Chat ID: ${chatId}`);
    
    const maxRetries = 3;
    const baseDelay = 1000; // 1秒基础延迟
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📱 尝试第 ${attempt}/${maxRetries} 次发送消息`);
      
      try {
        const result = await this.sendMessageAttempt(chatId, message, attempt);
        console.log(`📱 第 ${attempt} 次尝试成功`);
        return result;
      } catch (error) {
        console.log(`📱 第 ${attempt} 次尝试失败:`, error.message);
        
        // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
        if (attempt === maxRetries || this.isNonRetryableError(error)) {
          console.log(`📱 不再重试: ${attempt === maxRetries ? '达到最大重试次数' : '不可重试的错误'}`);
          throw error;
        }
        
        // 指数退避延迟
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`📱 等待 ${delay}ms 后重试...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * 判断是否为不可重试的错误
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'Unauthorized',
      '401',
      'bot was blocked',
      'chat not found',
      'Bad Request'
    ];
    
    return nonRetryableErrors.some(errorType => 
      error.message.includes(errorType)
    );
  }

  /**
   * 睡眠函数
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 单次发送消息尝试
   */
  async sendMessageAttempt(chatId, message, attempt) {
    try {
      if (!this.config.botToken) {
        throw new Error('Telegram Bot Token 未配置');
      }

      if (!this.config.apiUrl) {
        throw new Error('Telegram API URL 未配置');
      }

      // 网络连通性检测
      if (attempt === 1) {
        console.log(`📱 进行网络连通性检测...`);
        const connectivityResult = await this.checkNetworkConnectivity();
        if (!connectivityResult.success) {
          console.log(`📱 网络连通性检测失败: ${connectivityResult.message}`);
        } else {
          console.log(`📱 网络连通性检测通过: ${connectivityResult.message}`);
        }
      }

      // 准备请求数据 - 使用JSON格式提高兼容性
      const requestData = {
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
        parse_mode: 'HTML'
      };

      console.log(`📱 准备发送消息数据:`, {
        chat_id: chatId,
        text_length: message.length,
        disable_web_page_preview: true,
        apiUrl: `${this.config.apiUrl}/sendMessage`,
        attempt: attempt
      });

      console.log(`📱 开始发送 HTTP 请求到 Telegram API...`);
      console.log(`📱 请求 URL: ${this.config.apiUrl}/sendMessage`);
      
      // 优化的fetch配置，专门针对Cloudflare Worker
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'lzreview-bot/1.0',
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify(requestData),
        // Cloudflare Worker optimizations
        signal: AbortSignal.timeout(30000), // 30秒超时
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
      };
      
      console.log(`📱 发送请求配置:`, {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        timeout: '30s',
        attempt: attempt
      });
      
      const response = await fetch(`${this.config.apiUrl}/sendMessage`, fetchOptions);

      console.log(`📱 HTTP 响应状态: ${response.status} ${response.statusText}`);
      console.log(`📱 HTTP 响应头:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.log(`📱 API 原始错误响应:`, responseText);
          
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.log(`📱 JSON 解析失败:`, parseError.message);
            errorData = { description: responseText || response.statusText };
          }
        } catch (e) {
          console.log(`📱 读取响应失败:`, e.message);
          errorData = { description: response.statusText };
        }
        
        console.log(`📱 API 解析后错误响应:`, errorData);
        
        let errorMessage = `HTTP ${response.status}`;
        if (errorData.description) {
          errorMessage += ` - ${errorData.description}`;
        }
        if (errorData.error_code) {
          errorMessage += ` (错误代码: ${errorData.error_code})`;
        }
        
        throw new Error(errorMessage);
      }

      console.log(`📱 开始解析响应 JSON...`);
      const result = await response.json();
      console.log(`📱 API 响应结果:`, result);
      
      if (!result.ok) {
        throw new Error(`Telegram API 返回错误: ${result.description}`);
      }
      
      console.log(`📱 消息发送成功 - Message ID: ${result.result.message_id}`);
      return {
        success: true,
        message: '消息发送成功',
        messageId: result.result.message_id
      };

    } catch (error) {
      console.error(`📱 第 ${attempt} 次消息发送失败:`, error);
      
      // 详细的错误分类
      let errorMessage = error.message;
      let errorType = 'unknown';
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = '请求超时 - Telegram API 响应时间过长';
        errorType = 'timeout';
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = '网络请求失败 - 无法连接到 Telegram API，请检查网络连接';
        errorType = 'network';
      } else if (error.message.includes('internal error')) {
        errorMessage = 'Cloudflare Worker 内部错误 - 可能是网络限制或资源限制';
        errorType = 'worker_error';
      } else if (error.message.includes('chat not found') || error.message.includes('Bad Request: chat not found')) {
        errorMessage = '聊天未找到 - 请检查 Chat ID 是否正确，或确认机器人已加入群组/频道';
        errorType = 'chat_not_found';
      } else if (error.message.includes('bot was blocked') || error.message.includes('Forbidden: bot was blocked')) {
        errorMessage = '机器人被用户屏蔽 - 请联系用户解除屏蔽';
        errorType = 'bot_blocked';
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Bot Token 无效 - 请检查 TELEGRAM_BOT_TOKEN 环境变量配置';
        errorType = 'unauthorized';
      } else if (error.message.includes('Bad Request')) {
        errorMessage = `请求格式错误 - ${error.message}`;
        errorType = 'bad_request';
      } else if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        errorMessage = '请求过于频繁 - Telegram API 限流，请稍后重试';
        errorType = 'rate_limit';
      } else if (error.message.includes('Internal Server Error') || error.message.includes('500')) {
        errorMessage = 'Telegram 服务器内部错误 - 请稍后重试';
        errorType = 'server_error';
      }
      
      console.log(`📱 错误类型: ${errorType} (${error.name}), 错误消息: ${errorMessage}`);
      console.log(`📱 原始错误:`, error);
      
      // 创建包含详细信息的错误对象
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
      console.log(`📱 检测到 api.telegram.org 的连通性...`);
      
      // 使用简单的GET请求检测连通性
      const response = await fetch('https://api.telegram.org/bot' + this.config.botToken + '/getMe', {
        method: 'GET',
        headers: {
          'User-Agent': 'lzreview-bot/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          return {
            success: true,
            message: `Bot @${result.result.username} 连接正常`
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
        message: `网络连接失败: ${error.message}`
      };
    }
  }

  /**
   * 测试Telegram推送功能
   */
  async test(testConfig = {}) {
    try {
      // 首先检查基本配置
      if (!this.config.botToken) {
        return {
          success: false,
          message: 'Bot Token 未配置，请检查环境变量 TELEGRAM_BOT_TOKEN'
        };
      }

      if (!this.config.apiUrl) {
        return {
          success: false,
          message: 'API URL 未配置，请检查 Bot Token 格式'
        };
      }

      console.log('📱 配置检查完成，开始验证Bot Token...');
      
      const testChatId = testConfig.testChatId;
      
      if (!testChatId) {
        return {
          success: false,
          message: '请提供测试用的 Chat ID'
        };
      }

      // 直接尝试发送测试消息（跳过getBotInfo以避免可能的网络问题）
      console.log('📱 发送测试消息...');
      const testMessage = this.generateTestMessage();
      const result = await this.sendMessage(testChatId, testMessage);
      
      return {
        success: result.success,
        message: result.success 
          ? `测试消息已发送到 Chat ID: ${testChatId}` 
          : `测试消息发送失败: ${result.message}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Telegram推送测试失败: ${error.message}`
      };
    }
  }

  /**
   * 生成测试消息
   */
  generateTestMessage() {
    return `🧪 lzreview Telegram推送测试

✅ 如果您收到这条消息，说明Telegram推送功能正常工作

📊 测试信息:
• 测试时间: ${this.formatDate(new Date())}
• 推送方式: Telegram Bot API
• 消息格式: 纯文本

这是来自 lzreview 评论系统的测试消息`;
  }

  /**
   * 获取Bot信息（用于验证Token）
   */
  async getBotInfo() {
    try {
      if (!this.config.botToken) {
        throw new Error('Telegram Bot Token 未配置');
      }

      if (!this.config.apiUrl) {
        throw new Error('Telegram API URL 未配置');
      }

      const response = await fetch(`${this.config.apiUrl}/getMe`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(`API错误: ${result.description}`);
      }

      return {
        success: true,
        botInfo: result.result
      };
    } catch (error) {
      return {
        success: false,
        message: `获取Bot信息失败: ${error.message}`
      };
    }
  }

  /**
   * 转义HTML特殊字符
   */
  escapeHTML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
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