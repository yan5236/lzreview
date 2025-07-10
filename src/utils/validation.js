export function validateComment(data) {
  const errors = [];
  
  // 验证数据类型
  if (!data || typeof data !== 'object') {
    errors.push('无效的请求数据');
    return { isValid: false, errors };
  }
  
  // 验证页面URL
  if (!data.pageUrl || typeof data.pageUrl !== 'string') {
    errors.push('页面URL不能为空');
  } else if (!isValidUrl(data.pageUrl)) {
    errors.push('页面URL格式不正确');
  }
  
  // 验证用户名
  if (!data.authorName || typeof data.authorName !== 'string' || data.authorName.trim().length === 0) {
    errors.push('用户名不能为空');
  } else if (data.authorName.length > 50) {
    errors.push('用户名不能超过50个字符');
  } else if (containsControlCharacters(data.authorName)) {
    errors.push('用户名包含非法字符');
  }
  
  // 验证评论内容
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('评论内容不能为空');
  } else if (data.content.length > 1000) {
    errors.push('评论内容不能超过1000个字符');
  } else if (containsControlCharacters(data.content)) {
    errors.push('评论内容包含非法字符');
  }
  
  // 验证邮箱
  if (data.authorEmail && !isValidEmail(data.authorEmail)) {
    errors.push('邮箱格式不正确');
  }
  
  // 验证QQ号
  if (data.authorQQ && !isValidQQ(data.authorQQ)) {
    errors.push('QQ号格式不正确');
  }
  
  // 验证父评论ID
  if (data.parentId && (!Number.isInteger(data.parentId) || data.parentId <= 0)) {
    errors.push('父评论ID格式不正确');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidQQ(qq) {
  if (typeof qq !== 'string' || qq.length === 0) {
    return false;
  }
  
  // QQ号必须是5-11位数字，且不能以0开头
  const qqRegex = /^[1-9][0-9]{4,10}$/;
  return qqRegex.test(qq);
}

// 检查字符串是否包含控制字符或危险字符
export function containsControlCharacters(str) {
  if (typeof str !== 'string') return false;
  
  // 检查控制字符和危险字符
  const dangerousChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF]/;
  return dangerousChars.test(str);
}

// 标准化域名
export function normalizeDomain(domain) {
  if (typeof domain !== 'string') return '';
  
  try {
    // 转换为小写
    domain = domain.toLowerCase();
    
    // 移除前后空格
    domain = domain.trim();
    
    // 处理国际化域名
    if (domain.includes('xn--')) {
      try {
        // 尝试使用URL构造器标准化
        const url = new URL(`http://${domain}`);
        domain = url.hostname;
      } catch (e) {
        // 如果失败，返回原域名
      }
    }
    
    return domain;
  } catch (e) {
    return '';
  }
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')  // 必须首先转义&符号
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\n/g, '&#x0A;')  // 转义换行符
    .replace(/\r/g, '&#x0D;')  // 转义回车符
    .replace(/\t/g, '&#x09;'); // 转义制表符
}

export function isValidUrl(url) {
  try {
    if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
      return false;
    }
    
    // 检查URL格式
    const urlObj = new URL(url);
    
    // 只允许http和https协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // 检查主机名格式
    if (!urlObj.hostname || urlObj.hostname.length > 253) {
      return false;
    }
    
    // 防止IP地址绕过
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(urlObj.hostname)) {
      // 如果是IP地址，需要额外验证
      const parts = urlObj.hostname.split('.');
      if (parts.some(part => parseInt(part) > 255)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}