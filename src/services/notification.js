import { EmailNotifier } from '../notifiers/email.js';
import { TelegramNotifier } from '../notifiers/telegram.js';

/**
 * 通知推送服务核心模块
 * 负责管理和协调不同类型的通知推送器
 */
export class NotificationService {
  constructor(env) {
    this.env = env;
    this.notifiers = {};
    
    // 初始化可用的推送器
    this.initializeNotifiers();
  }

  /**
   * 初始化通知推送器
   */
  initializeNotifiers() {
    // 邮箱推送器 (使用 Resend)
    if (this.env.RESEND_API_KEY) {
      this.notifiers.email = new EmailNotifier({
        apiKey: this.env.RESEND_API_KEY,
        fromName: this.env.NOTIFICATION_FROM_NAME || 'lzreview评论系统',
        fromEmail: this.env.NOTIFICATION_FROM_EMAIL || 'notifications@example.com'
      });
    }

    // Telegram推送器
    if (this.env.TELEGRAM_BOT_TOKEN) {
      this.notifiers.telegram = new TelegramNotifier({
        botToken: this.env.TELEGRAM_BOT_TOKEN,
        parseMode: this.env.TELEGRAM_PARSE_MODE || 'HTML'
      });
    }

    // 未来可以添加更多推送器：
    // - 企业微信推送器
    // - 钉钉推送器
    // - Webhook推送器
    // - 等等...
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
    console.log('📧 NotificationService: 开始发送新评论通知');
    console.log('📧 可用推送器:', Object.keys(this.notifiers));
    
    const notifications = [];
    
    try {
      // 邮箱通知
      if (notificationConfig.email && this.notifiers.email) {
        console.log('📧 开始发送邮箱通知...');
        console.log('📧 邮箱配置:', notificationConfig.email);
        
        const emailResult = await this.notifiers.email.sendNewCommentNotification(
          commentData, 
          notificationConfig.email
        );
        
        console.log('📧 邮箱通知结果:', emailResult);
        
        notifications.push({
          type: 'email',
          success: emailResult.success,
          message: emailResult.message,
          details: emailResult.details
        });
      } else {
        console.log('⚠️ 邮箱通知跳过 - 配置或推送器不可用');
        console.log('⚠️ 邮箱配置存在:', !!notificationConfig.email);
        console.log('⚠️ 邮箱推送器存在:', !!this.notifiers.email);
      }

      // Telegram通知
      if (notificationConfig.telegram && this.notifiers.telegram) {
        console.log('📱 开始发送Telegram通知...');
        console.log('📱 Telegram配置:', notificationConfig.telegram);
        
        const telegramResult = await this.notifiers.telegram.sendNewCommentNotification(
          commentData, 
          notificationConfig.telegram
        );
        
        console.log('📱 Telegram通知结果:', telegramResult);
        
        notifications.push({
          type: 'telegram',
          success: telegramResult.success,
          message: telegramResult.message,
          details: telegramResult.details
        });
      } else {
        console.log('⚠️ Telegram通知跳过 - 配置或推送器不可用');
        console.log('⚠️ Telegram配置存在:', !!notificationConfig.telegram);
        console.log('⚠️ Telegram推送器存在:', !!this.notifiers.telegram);
      }

      // 未来可以添加其他类型的通知
      // if (notificationConfig.webhook && this.notifiers.webhook) { ... }
      // if (notificationConfig.wechat && this.notifiers.wechat) { ... }

      return {
        success: notifications.some(n => n.success),
        results: notifications,
        summary: this.generateNotificationSummary(notifications)
      };

    } catch (error) {
      console.error('通知发送失败:', error);
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
        message: `推送器类型 "${type}" 不可用`
      };
    }

    try {
      return await this.notifiers[type].test(config);
    } catch (error) {
      console.error(`测试${type}推送器失败:`, error);
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
    const successful = notifications.filter(n => n.success).length;
    const failed = total - successful;

    if (total === 0) {
      return '未配置任何通知方式';
    }

    if (successful === total) {
      return `所有通知发送成功 (${successful}/${total})`;
    } else if (successful === 0) {
      return `所有通知发送失败 (${failed}/${total})`;
    } else {
      return `部分通知发送成功 (${successful}/${total})，${failed}个失败`;
    }
  }

  /**
   * 获取通知配置模板
   */
  getNotificationConfigTemplate() {
    return {
      email: {
        enabled: false,
        recipients: [], // 管理员邮箱列表
        subscribers: [], // 订阅者邮箱列表
        includePageInfo: true,
        includeCommentContent: true,
        template: 'default'
      },
      telegram: {
        enabled: false,
        chatIds: [], // 接收通知的Chat ID列表
        includePageInfo: true,
        includeCommentContent: true,
        template: 'default'
      },
      // 未来扩展的配置项
      webhook: {
        enabled: false,
        url: '',
        method: 'POST',
        headers: {},
        template: 'default'
      }
    };
  }
}

/**
 * 通知工具函数
 */
export class NotificationUtils {
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
    if (typeof chatId === 'number') {
      return true; // 数字类型的Chat ID
    }
    if (typeof chatId === 'string') {
      // 字符串类型的Chat ID，可能是用户名(@username)或者纯数字字符串
      return /^@[\w_]+$/.test(chatId) || /^-?\d+$/.test(chatId);
    }
    return false;
  }

  /**
   * 验证通知配置
   */
  static validateNotificationConfig(config) {
    const errors = [];

    // 验证邮箱配置
    if (config.email && config.email.enabled) {
      if (!config.email.recipients || !Array.isArray(config.email.recipients)) {
        errors.push('邮箱配置：收件人列表必须是数组');
      } else {
        config.email.recipients.forEach((email, index) => {
          if (!this.isValidEmail(email)) {
            errors.push(`邮箱配置：第${index + 1}个收件人邮箱格式无效 - ${email}`);
          }
        });
      }

      if (config.email.subscribers && Array.isArray(config.email.subscribers)) {
        config.email.subscribers.forEach((email, index) => {
          if (!this.isValidEmail(email)) {
            errors.push(`邮箱配置：第${index + 1}个订阅者邮箱格式无效 - ${email}`);
          }
        });
      }
    }

    // 验证Telegram配置
    if (config.telegram && config.telegram.enabled) {
      if (!config.telegram.chatIds || !Array.isArray(config.telegram.chatIds)) {
        errors.push('Telegram配置：Chat ID列表必须是数组');
      } else if (config.telegram.chatIds.length === 0) {
        errors.push('Telegram配置：至少需要配置一个Chat ID');
      } else {
        config.telegram.chatIds.forEach((chatId, index) => {
          if (!this.isValidChatId(chatId)) {
            errors.push(`Telegram配置：第${index + 1}个Chat ID格式无效 - ${chatId}`);
          }
        });
      }
    }

    // 验证Webhook配置
    if (config.webhook && config.webhook.enabled) {
      if (!config.webhook.url || !config.webhook.url.startsWith('http')) {
        errors.push('Webhook配置：URL地址无效');
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
      
      // 移除文件扩展名和路径分隔符
      const title = pathname
        .split('/')
        .filter(segment => segment && segment !== 'index')
        .pop() || urlObj.hostname;
      
      return title.replace(/\.(html|htm|php)$/, '') || '未知页面';
    } catch {
      return '未知页面';
    }
  }

  /**
   * 生成通知摘要文本
   */
  static generateNotificationDigest(comments, timeFrame = '24小时') {
    if (!comments || comments.length === 0) {
      return `过去${timeFrame}内没有新评论`;
    }

    const pageGroups = {};
    comments.forEach(comment => {
      const pageUrl = comment.pageUrl || comment.page_url;
      if (!pageGroups[pageUrl]) {
        pageGroups[pageUrl] = [];
      }
      pageGroups[pageUrl].push(comment);
    });

    const summary = Object.entries(pageGroups)
      .map(([pageUrl, pageComments]) => {
        const pageTitle = this.extractPageTitle(pageUrl);
        return `${pageTitle}: ${pageComments.length}条评论`;
      })
      .join('，');

    return `过去${timeFrame}内收到${comments.length}条新评论：${summary}`;
  }
}