export function getClientIP(request) {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const xRealIP = request.headers.get('X-Real-IP');
  
  return cfConnectingIP || xForwardedFor?.split(',')[0] || xRealIP || 'unknown';
}

export function getUserAgent(request) {
  return request.headers.get('User-Agent') || 'unknown';
}

export function rateLimitCheck(ip, cache) {
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowMs = 60000; // 1分钟
  const maxRequests = 10; // 每分钟最多10个请求
  
  const requests = cache.get(key) || [];
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  cache.set(key, validRequests);
  
  // 清理过期的缓存项
  if (validRequests.length > maxRequests * 2) {
    cache.set(key, validRequests.slice(-maxRequests));
  }
  
  return true;
}

export async function hashEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  try {
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    // 添加盐值增加安全性
    const data = encoder.encode(email.toLowerCase() + 'email_salt_2023');
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Hash email error:', error);
    return null;
  }
}

export function containsBadWords(text) {
  if (typeof text !== 'string') return false;
  
  const badWords = [
    '垃圾', '广告', 'spam', '色情', '赌博', '毒品', 
    '暴力', '恐怖', '反动', '分裂', '邪教',
    'fuck', 'shit', 'bitch', 'porn', 'sex',
    // 可以根据需要添加更多敏感词
  ];
  
  const lowerText = text.toLowerCase();
  
  return badWords.some(word => {
    // 检查直接匹配
    if (lowerText.includes(word)) return true;
    
    // 检查变体（用数字替换字母等）
    const variations = generateWordVariations(word);
    return variations.some(variant => lowerText.includes(variant));
  });
}

// 生成词汇变体（简单的变体检测）
function generateWordVariations(word) {
  const variations = [word];
  
  // 数字替换
  const replacements = {
    'a': ['@', '4'],
    'e': ['3'],
    'i': ['1', '!'],
    'o': ['0'],
    's': ['$', '5'],
    't': ['7']
  };
  
  let current = word;
  for (const [letter, nums] of Object.entries(replacements)) {
    for (const num of nums) {
      variations.push(current.replace(new RegExp(letter, 'g'), num));
    }
  }
  
  return variations;
}

// 生成安全的随机令牌
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// 安全的令牌验证
export function verifySecureToken(token, validTokens) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // 防止时序攻击
  let isValid = false;
  for (const validToken of validTokens) {
    if (constantTimeCompare(token, validToken)) {
      isValid = true;
    }
  }
  
  return isValid;
}

// 常量时间比较，防止时序攻击
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// 生成CSRF令牌
export function generateCSRFToken() {
  return generateSecureToken(32);
}

// 验证CSRF令牌
export function verifyCSRFToken(token, session) {
  if (!token || !session || !session.csrfToken) {
    return false;
  }
  
  return constantTimeCompare(token, session.csrfToken);
}

// 安全的IP地址哈希
export async function hashIP(ip) {
  if (!ip || typeof ip !== 'string') {
    return 'unknown';
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'salt_for_privacy');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 清理敏感数据
export function sanitizeErrorMessage(error) {
  if (!error) return '未知错误';
  
  const message = error.message || error.toString();
  
  // 移除可能包含敏感信息的错误消息
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
      return '系统错误，请稍后重试';
    }
  }
  
  return message;
}