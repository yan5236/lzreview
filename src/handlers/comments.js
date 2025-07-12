import { validateComment, sanitizeInput } from '../utils/validation.js';
import { getClientIP, getUserAgent, rateLimitCheck, containsBadWords, generateCSRFToken, verifyCSRFToken, hashIP, sanitizeErrorMessage } from '../utils/security.js';
import { jsonResponse, errorResponse, successResponse } from '../utils/response.js';
import { triggerCommentNotification } from './notifications.js';

const cache = new Map();
const csrfTokens = new Map(); // 存储CSRF令牌

export async function handleComments(request, db, env, ctx) {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  // 基础速率限制（使用数据库）
  try {
    const ipHash = await hashIP(ip);
    const isAllowed = await db.checkRateLimit(ipHash, 10, 1);
    if (!isAllowed) {
      return errorResponse('请求过于频繁，请稍后再试', 429);
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // 如果速率限制检查失败，使用内存备用方案
    if (!rateLimitCheck(ip, cache)) {
      return errorResponse('请求过于频繁，请稍后再试', 429);
    }
  }

  try {
    switch (method) {
      case 'GET':
        // CSRF令牌端点
        if (url.pathname === '/api/comments/csrf-token') {
          return await getCSRFToken(request);
        }
        // 管理员专用接口
        if (url.pathname === '/api/comments/all') {
          return await getAllCommentsForAdmin(request, db);
        }
        if (url.pathname === '/api/comments/stats') {
          return await getStatsForAdmin(request, db);
        }
        if (url.pathname === '/api/comments/pages') {
          return await getPagesForAdmin(request, db);
        }
        return await getComments(request, db);
      case 'POST':
        return await createComment(request, db, env, ctx);
      case 'DELETE':
        if (url.pathname === '/api/comments/batch') {
          return await batchDeleteComments(request, db);
        }
        if (url.pathname === '/api/comments/page') {
          return await deletePageComments(request, db);
        }
        return await deleteComment(request, db);
      default:
        return errorResponse('不支持的请求方法', 405);
    }
  } catch (error) {
    console.error('API Error:', error);
    const safeMessage = sanitizeErrorMessage(error);
    return errorResponse(safeMessage, 500);
  }
}

async function getComments(request, db) {
  const url = new URL(request.url);
  const pageUrl = url.searchParams.get('page');
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  if (!pageUrl) {
    return errorResponse('缺少页面URL参数');
  }

  // 解码URL参数
  const decodedPageUrl = decodeURIComponent(pageUrl);
  
  // 白名单验证
  try {
    const urlObj = new URL(decodedPageUrl);
    const hostname = urlObj.hostname;
    const hostWithPort = urlObj.host; // 包含端口的主机名
    
    // 检查hostname和host两种格式
    const isHostnameWhitelisted = await db.isWhitelisted(hostname);
    const isHostWithPortWhitelisted = await db.isWhitelisted(hostWithPort);
    
    if (!isHostnameWhitelisted && !isHostWithPortWhitelisted) {
      return errorResponse(`评论系统已设置为白名单模式，域名 ${hostWithPort} 未被授权使用评论功能。请联系系统管理员。`, 403);
    }
  } catch (error) {
    console.error('白名单验证失败:', error);
    return errorResponse('域名验证失败');
  }

  try {
    const comments = await db.getComments(decodedPageUrl, limit, offset);
    const total = await db.getCommentCount(decodedPageUrl);

    // 组织评论为树形结构
    const commentsTree = buildCommentsTree(comments);

    return successResponse({
      comments: commentsTree,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return errorResponse('获取评论失败');
  }
}

async function createComment(request, db, env, ctx) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return errorResponse('请求数据格式错误');
    }
    // 白名单验证
    try {
      const urlObj = new URL(data.pageUrl);
      const hostname = urlObj.hostname;
      const hostWithPort = urlObj.host; // 包含端口的主机名
      
      // 检查hostname和host两种格式
      const isHostnameWhitelisted = await db.isWhitelisted(hostname);
      const isHostWithPortWhitelisted = await db.isWhitelisted(hostWithPort);
      
      if (!isHostnameWhitelisted && !isHostWithPortWhitelisted) {
        return errorResponse(`评论系统已设置为白名单模式，域名 ${hostWithPort} 未被授权使用评论功能。请联系系统管理员。`, 403);
      }
    } catch (error) {
      console.error('白名单验证失败:', error);
      return errorResponse('域名验证失败');
    }
    
    // CSRF令牌验证（暂时禁用，稍后优化）
    // const csrfToken = data.csrfToken;
    // if (!validateCSRFToken(request, csrfToken)) {
    //   return errorResponse('安全验证失败，请刷新页面重试', 403);
    // }
    
    // 数据验证
    const validation = validateComment(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join('; '));
    }

    // 内容安全检查
    if (containsBadWords(data.content) || containsBadWords(data.authorName)) {
      return errorResponse('评论包含不当内容，请修改后重试');
    }

    // 净化输入数据
    const clientIP = getClientIP(request);
    const hashedIP = await hashIP(clientIP);
    
    const sanitizedData = {
      pageUrl: data.pageUrl,
      authorName: sanitizeInput(data.authorName.trim()),
      authorEmail: data.authorEmail ? data.authorEmail.trim() : null,
      authorQQ: data.authorQQ ? data.authorQQ.trim() : null,
      content: sanitizeInput(data.content.trim()),
      parentId: data.parentId || null,
      ipAddress: hashedIP, // 存储哈希后的IP
      userAgent: getUserAgent(request)
    };

    // 插入评论
    try {
      const commentId = await db.addComment(sanitizedData);
      
      // 使用 ctx.waitUntil 异步触发通知推送（不阻塞响应，但确保任务完成）
      const commentDataForNotification = {
        ...sanitizedData,
        id: commentId,
        createdAt: new Date().toISOString()
      };
      
      // 使用 waitUntil 确保异步通知任务能够完成
      ctx.waitUntil(
        triggerCommentNotification(commentDataForNotification, db, env)
          .then(result => {
            if (result.success) {
              console.log('📬 评论通知发送成功');
            } else {
              console.error('📬 通知发送失败:', result.error || result.summary);
            }
          })
          .catch(error => {
            console.error('📬 通知发送异常:', error.message);
          })
      );
      
      return successResponse(
        { 
          id: commentId,
          message: '评论发布成功'
        },
        '评论发布成功'
      );
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      const safeMessage = sanitizeErrorMessage(dbError);
      return errorResponse(`发布评论失败：${safeMessage}`);
    }

  } catch (error) {
    console.error('Create comment error:', error);
    const safeMessage = sanitizeErrorMessage(error);
    return errorResponse(`发布评论失败：${safeMessage}`);
  }
}

async function deleteComment(request, db) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const commentId = pathParts[pathParts.length - 1];

  if (!commentId || isNaN(commentId)) {
    return errorResponse('无效的评论ID');
  }

  // 检查管理员权限
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return errorResponse('需要管理员权限', 401);
  }

  try {
    const deleted = await db.deleteComment(parseInt(commentId), token);
    
    if (deleted) {
      return successResponse(null, '评论删除成功');
    } else {
      return errorResponse('评论不存在或删除失败', 404);
    }
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return errorResponse('管理员权限验证失败', 403);
    }
    console.error('Delete comment error:', error);
    return errorResponse('删除评论失败');
  }
}

function buildCommentsTree(comments) {
  const commentMap = {};
  const rootComments = [];

  // 创建评论映射
  comments.forEach(comment => {
    comment.replies = [];
    commentMap[comment.id] = comment;
  });

  // 构建树形结构
  comments.forEach(comment => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      commentMap[comment.parent_id].replies.push(comment);
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

// 管理员专用：获取所有评论
async function getAllCommentsForAdmin(request, db) {
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
    const comments = await db.getAllComments();
    return successResponse({ comments });
  } catch (error) {
    console.error('Get all comments error:', error);
    return errorResponse('获取评论失败');
  }
}

// 管理员专用：获取统计信息
async function getStatsForAdmin(request, db) {
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
    const stats = await db.getStats();
    return successResponse(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse('获取统计信息失败');
  }
}

// 管理员专用：获取页面列表
async function getPagesForAdmin(request, db) {
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
    const pages = await db.getPages();
    return successResponse({ pages });
  } catch (error) {
    console.error('Get pages error:', error);
    return errorResponse('获取页面列表失败');
  }
}

// 管理员专用：批量删除评论
async function batchDeleteComments(request, db) {
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
    const { ids } = data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('请提供要删除的评论ID列表');
    }

    const deletedCount = await db.batchDeleteComments(ids);
    return successResponse({ deletedCount }, `成功删除 ${deletedCount} 条评论`);
  } catch (error) {
    console.error('Batch delete error:', error);
    return errorResponse('批量删除失败');
  }
}

// 管理员专用：删除页面所有评论
async function deletePageComments(request, db) {
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
    const { pageUrl } = data;

    if (!pageUrl) {
      return errorResponse('请提供页面URL');
    }

    const deletedCount = await db.deletePageComments(pageUrl);
    return successResponse({ deletedCount }, `成功删除 ${deletedCount} 条评论`);
  } catch (error) {
    console.error('Delete page comments error:', error);
    return errorResponse('删除页面评论失败');
  }
}

// 获取CSRF令牌
async function getCSRFToken(request) {
  const ip = getClientIP(request);
  const token = generateCSRFToken();
  
  // 存储令牌，设置30分钟过期
  const expiresAt = Date.now() + 30 * 60 * 1000;
  csrfTokens.set(ip, { token, expiresAt });
  
  // 清理过期令牌
  cleanExpiredTokens();
  
  return successResponse({ csrfToken: token });
}

// 验证CSRF令牌
function validateCSRFToken(request, token) {
  if (!token) return false;
  
  const ip = getClientIP(request);
  const stored = csrfTokens.get(ip);
  
  if (!stored || Date.now() > stored.expiresAt) {
    return false;
  }
  
  return stored.token === token;
}

// 清理过期令牌
function cleanExpiredTokens() {
  const now = Date.now();
  for (const [ip, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(ip);
    }
  }
}