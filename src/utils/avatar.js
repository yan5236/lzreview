// 头像生成工具函数

// 生成QQ头像URL
export function getQQAvatar(qq) {
  if (!qq || !/^\d+$/.test(qq)) {
    return null;
  }
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
}

// 生成GitHub风格的随机头像
export function getGitHubStyleAvatar(seed) {
  // 使用名字或邮箱作为种子生成确定性的头像
  const hash = simpleHash(seed || 'anonymous');
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${hash}&size=100`;
}

// 简单哈希函数，用于生成确定性的种子
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

// 获取头像URL
export function getAvatarUrl(authorName, authorEmail, authorQQ) {
  // 优先使用QQ头像
  if (authorQQ) {
    const qqAvatar = getQQAvatar(authorQQ);
    if (qqAvatar) {
      return qqAvatar;
    }
  }
  
  // 使用GitHub风格头像
  const seed = authorEmail || authorName || 'anonymous';
  return getGitHubStyleAvatar(seed);
}

// 预加载头像，检查是否可用
export function preloadAvatar(url, fallbackUrl = null) {
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