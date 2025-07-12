import { NotificationService, NotificationUtils } from '../services/notification.js';
import { jsonResponse, errorResponse, successResponse } from '../utils/response.js';

/**
 * 通知推送配置和管理处理器
 */
export async function handleNotifications(request, db, env) {
  const url = new URL(request.url);
  const method = request.method;

  try {
    switch (method) {
      case 'GET':
        // 获取通知配置
        if (url.pathname === '/api/notifications/config') {
          return await getNotificationConfig(request, db);
        }
        // 获取可用的推送器列表
        if (url.pathname === '/api/notifications/notifiers') {
          return await getAvailableNotifiers(request, env);
        }
        // 获取邮件订阅列表
        if (url.pathname === '/api/notifications/subscribers') {
          return await getEmailSubscribers(request, db);
        }
        // 获取 Telegram 订阅列表
        if (url.pathname === '/api/notifications/telegram-subscribers') {
          return await getTelegramSubscribers(request, db);
        }
        return errorResponse('未找到对应的API端点', 404);

      case 'POST':
        // 更新通知配置
        if (url.pathname === '/api/notifications/config') {
          return await updateNotificationConfig(request, db);
        }
        // 测试推送器
        if (url.pathname === '/api/notifications/test') {
          return await testNotificationService(request, db, env);
        }
        // 添加邮件订阅
        if (url.pathname === '/api/notifications/subscribe') {
          return await addEmailSubscriber(request, db);
        }
        // 添加 Telegram 订阅
        if (url.pathname === '/api/notifications/telegram-subscribe') {
          return await addTelegramSubscriber(request, db);
        }
        // 手动发送通知
        if (url.pathname === '/api/notifications/send') {
          return await sendManualNotification(request, db, env);
        }
        return errorResponse('未找到对应的API端点', 404);

      case 'DELETE':
        // 删除邮件订阅
        if (url.pathname.startsWith('/api/notifications/subscribe/')) {
          return await removeEmailSubscriber(request, db);
        }
        // 删除 Telegram 订阅
        if (url.pathname.startsWith('/api/notifications/telegram-subscribe/')) {
          return await removeTelegramSubscriber(request, db);
        }
        return errorResponse('未找到对应的API端点', 404);

      default:
        return errorResponse('不支持的请求方法', 405);
    }
  } catch (error) {
    console.error('通知API错误:', error);
    return errorResponse('处理通知请求时发生错误', 500);
  }
}

/**
 * 获取通知配置
 */
async function getNotificationConfig(request, db) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const config = await db.getNotificationConfig();
    return successResponse(config);
  } catch (error) {
    console.error('获取通知配置失败:', error);
    // 如果数据库中没有配置，返回默认配置
    const notificationService = new NotificationService();
    return successResponse(notificationService.getNotificationConfigTemplate());
  }
}

/**
 * 更新通知配置
 */
async function updateNotificationConfig(request, db) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const data = await request.json();
    
    // 验证配置数据
    const validation = NotificationUtils.validateNotificationConfig(data);
    if (!validation.isValid) {
      return errorResponse(`配置验证失败: ${validation.errors.join('; ')}`);
    }

    // 保存配置
    await db.saveNotificationConfig(data);
    
    return successResponse(null, '通知配置更新成功');
  } catch (error) {
    console.error('更新通知配置失败:', error);
    return errorResponse('更新通知配置失败');
  }
}

/**
 * 获取可用的推送器列表
 */
async function getAvailableNotifiers(request, env) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  try {
    const notificationService = new NotificationService(env);
    const availableNotifiers = notificationService.getAvailableNotifiers();
    
    const notifiersInfo = {
      email: {
        available: notificationService.isNotifierAvailable('email'),
        name: '邮箱推送',
        description: '通过 Resend API 发送邮件通知',
        requiredEnvVars: ['RESEND_API_KEY'],
        configured: !!env.RESEND_API_KEY
      },
      telegram: {
        available: notificationService.isNotifierAvailable('telegram'),
        name: 'Telegram推送',
        description: '通过 Telegram Bot API 发送消息通知',
        requiredEnvVars: ['TELEGRAM_BOT_TOKEN'],
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
    console.error('获取推送器列表失败:', error);
    return errorResponse('获取推送器列表失败');
  }
}

/**
 * 测试通知服务
 */
async function testNotificationService(request, db, env) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const data = await request.json();
    const { type, config } = data;

    if (!type) {
      return errorResponse('请指定要测试的推送器类型');
    }

    const notificationService = new NotificationService(env);
    
    if (!notificationService.isNotifierAvailable(type)) {
      return errorResponse(`推送器类型 "${type}" 不可用，请检查环境变量配置`);
    }

    const testResult = await notificationService.testNotifier(type, config);
    
    if (testResult.success) {
      return successResponse(testResult, '推送器测试成功');
    } else {
      return errorResponse(`推送器测试失败: ${testResult.message}`);
    }
  } catch (error) {
    console.error('测试通知服务失败:', error);
    return errorResponse('测试通知服务失败');
  }
}

/**
 * 发送手动通知（用于测试）
 */
async function sendManualNotification(request, db, env) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const data = await request.json();
    const { commentId, testEmail } = data;

    let commentData;
    
    if (commentId) {
      // 发送指定评论的通知
      commentData = await db.getCommentById(commentId);
      if (!commentData) {
        return errorResponse('评论不存在');
      }
    } else {
      // 发送测试通知
      commentData = {
        id: 'test-' + Date.now(),
        pageUrl: 'https://example.com/test-page',
        pageTitle: '测试页面',
        authorName: '测试用户',
        authorEmail: 'test@example.com',
        content: '这是一条测试评论，用于验证通知推送功能是否正常工作。',
        createdAt: new Date().toISOString(),
        parentId: null,
        isReply: false
      };
    }

    // 获取通知配置
    const notificationConfig = await db.getNotificationConfig();
    
    // 如果提供了测试邮箱，临时修改配置
    if (testEmail && NotificationUtils.isValidEmail(testEmail)) {
      notificationConfig.email = {
        ...notificationConfig.email,
        enabled: true,
        recipients: [testEmail],
        subscribers: []
      };
    }

    // 发送通知
    const notificationService = new NotificationService(env);
    const formattedComment = NotificationUtils.formatCommentForNotification(commentData);
    const result = await notificationService.sendNewCommentNotification(
      formattedComment, 
      notificationConfig
    );

    if (result.success) {
      return successResponse(result, '通知发送成功');
    } else {
      return errorResponse(`通知发送失败: ${result.error || result.summary}`);
    }
  } catch (error) {
    console.error('发送手动通知失败:', error);
    return errorResponse('发送手动通知失败');
  }
}

/**
 * 获取邮件订阅列表
 */
async function getEmailSubscribers(request, db) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const subscribers = await db.getEmailSubscribers();
    return successResponse({ subscribers });
  } catch (error) {
    console.error('获取邮件订阅列表失败:', error);
    return successResponse({ subscribers: [] });
  }
}

/**
 * 添加邮件订阅
 */
async function addEmailSubscriber(request, db) {
  try {
    const data = await request.json();
    const { email, name, pageUrl } = data;

    if (!email || !NotificationUtils.isValidEmail(email)) {
      return errorResponse('请提供有效的邮箱地址');
    }

    // 检查是否已经订阅
    const existingSubscriber = await db.getEmailSubscriber(email);
    if (existingSubscriber) {
      return errorResponse('该邮箱已经订阅了通知');
    }

    // 添加订阅
    const subscriberId = await db.addEmailSubscriber({
      email,
      name: name || email.split('@')[0],
      pageUrl: pageUrl || null,
      subscribedAt: new Date().toISOString(),
      isActive: true
    });

    return successResponse({ 
      id: subscriberId,
      message: '邮箱订阅成功'
    }, '邮箱订阅成功');
  } catch (error) {
    console.error('添加邮件订阅失败:', error);
    return errorResponse('添加邮件订阅失败');
  }
}

/**
 * 删除邮件订阅
 */
async function removeEmailSubscriber(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const emailOrId = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!emailOrId) {
      return errorResponse('请提供邮箱地址或订阅ID');
    }

    // 尝试按邮箱地址删除
    let deleted = false;
    if (NotificationUtils.isValidEmail(emailOrId)) {
      deleted = await db.removeEmailSubscriberByEmail(emailOrId);
    } else {
      // 尝试按ID删除
      deleted = await db.removeEmailSubscriberById(emailOrId);
    }

    if (deleted) {
      return successResponse(null, '取消订阅成功');
    } else {
      return errorResponse('未找到对应的订阅记录', 404);
    }
  } catch (error) {
    console.error('删除邮件订阅失败:', error);
    return errorResponse('删除邮件订阅失败');
  }
}

/**
 * 处理新评论的通知推送
 * 这个函数会在评论创建成功后被调用
 */
export async function triggerCommentNotification(commentData, db, env) {
  try {
    // 获取通知配置
    const notificationConfig = await db.getNotificationConfig();
    
    // 检查是否启用了任何通知方式
    const hasEnabledNotifications = (
      (notificationConfig.email && notificationConfig.email.enabled) ||
      (notificationConfig.telegram && notificationConfig.telegram.enabled) ||
      (notificationConfig.webhook && notificationConfig.webhook.enabled)
    );

    if (!hasEnabledNotifications) {
      return { success: true, message: '未配置通知' };
    }

    // 创建通知服务实例
    const notificationService = new NotificationService(env);
    
    // 格式化评论数据
    const formattedComment = NotificationUtils.formatCommentForNotification(commentData);
    
    // 发送通知
    const result = await notificationService.sendNewCommentNotification(
      formattedComment, 
      notificationConfig
    );
    
    return result;
  } catch (error) {
    console.error('通知推送失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 获取 Telegram 订阅列表
 */
async function getTelegramSubscribers(request, db) {
  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  if (!db.isValidAdmin(token)) {
    return errorResponse('管理员权限验证失败', 403);
  }

  try {
    const subscribers = await db.getTelegramSubscribers();
    return successResponse({ subscribers });
  } catch (error) {
    console.error('获取 Telegram 订阅列表失败:', error);
    return successResponse({ subscribers: [] });
  }
}

/**
 * 添加 Telegram 订阅
 */
async function addTelegramSubscriber(request, db) {
  try {
    const data = await request.json();
    const { chatId, name, chatType, pageUrl } = data;

    if (!chatId || !NotificationUtils.isValidChatId(chatId)) {
      return errorResponse('请提供有效的 Chat ID');
    }

    // 检查是否已经订阅
    const existingSubscriber = await db.getTelegramSubscriber(chatId);
    if (existingSubscriber) {
      return errorResponse('该 Chat ID 已经订阅了通知');
    }

    // 添加订阅
    const subscriberId = await db.addTelegramSubscriber({
      chatId,
      name: name || `Chat ${chatId}`,
      chatType: chatType || 'private',
      pageUrl: pageUrl || null,
      subscribedAt: new Date().toISOString(),
      isActive: true
    });

    return successResponse({ 
      id: subscriberId,
      message: 'Telegram 订阅成功'
    }, 'Telegram 订阅成功');
  } catch (error) {
    console.error('添加 Telegram 订阅失败:', error);
    return errorResponse('添加 Telegram 订阅失败');
  }
}

/**
 * 删除 Telegram 订阅
 */
async function removeTelegramSubscriber(request, db) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const chatIdOrId = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!chatIdOrId) {
      return errorResponse('请提供 Chat ID 或订阅ID');
    }

    // 尝试按 Chat ID 删除
    let deleted = false;
    if (NotificationUtils.isValidChatId(chatIdOrId)) {
      deleted = await db.removeTelegramSubscriberByChatId(chatIdOrId);
    } else {
      // 尝试按ID删除
      deleted = await db.removeTelegramSubscriberById(chatIdOrId);
    }

    if (deleted) {
      return successResponse(null, '取消订阅成功');
    } else {
      return errorResponse('未找到对应的订阅记录', 404);
    }
  } catch (error) {
    console.error('删除 Telegram 订阅失败:', error);
    return errorResponse('删除 Telegram 订阅失败');
  }
}