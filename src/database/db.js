export class DatabaseService {
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
      console.error('Database getComments error:', error);
      return [];
    }
  }

  async addComment(commentData) {
    try {
      const { pageUrl, authorName, authorEmail, authorQQ, content, ipAddress, userAgent, parentId } = commentData;
      
      // 数据验证
      if (!pageUrl || !authorName || !content) {
        throw new Error('必要字段不能为空');
      }
      
      // 长度限制验证
      if (authorName.length > 50 || content.length > 1000) {
        throw new Error('字段长度超出限制');
      }
      
      if (authorEmail && authorEmail.length > 254) {
        throw new Error('邮箱地址过长');
      }
      
      if (authorQQ && authorQQ.length > 15) {
        throw new Error('QQ号过长');
      }
      
      console.log('Attempting to insert comment:', { pageUrl, authorName, content: content.substring(0, 50) + '...' });
      
      // 使用中国时间 (UTC+8)
      const chinaTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
      
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
      
      console.log('Insert result - ID:', result.meta.last_row_id);
      return result.meta.last_row_id;
    } catch (error) {
      console.error('Database addComment error:', error.message);
      throw new Error(`数据库错误：${error.message}`);
    }
  }

  async deleteComment(commentId, adminToken) {
    if (!this.isValidAdmin(adminToken)) {
      throw new Error('Unauthorized');
    }
    
    const stmt = this.db.prepare('DELETE FROM comments WHERE id = ?');
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
      console.error('Database getCommentCount error:', error);
      return 0;
    }
  }

  isValidAdmin(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    if (!this.adminToken || typeof this.adminToken !== 'string') {
      return false;
    }
    
    // 使用常量时间比较防止时序攻击
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
      console.error('Database getAllComments error:', error);
      return [];
    }
  }

  // 管理员专用：获取统计信息
  async getStats() {
    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM comments');
      const totalResult = await totalStmt.first();
      
      const todayStmt = this.db.prepare(`
        SELECT COUNT(*) as today 
        FROM comments 
        WHERE DATE(created_at) = DATE('now', '+8 hours')
      `);
      const todayResult = await todayStmt.first();
      
      const pagesStmt = this.db.prepare('SELECT COUNT(DISTINCT page_url) as pages FROM comments');
      const pagesResult = await pagesStmt.first();
      
      const whitelistStmt = this.db.prepare('SELECT COUNT(*) as whitelist FROM whitelist');
      const whitelistResult = await whitelistStmt.first();
      
      return {
        total: totalResult?.total || 0,
        today: todayResult?.today || 0,
        pages: pagesResult?.pages || 0,
        whitelist: whitelistResult?.whitelist || 0
      };
    } catch (error) {
      console.error('Database getStats error:', error);
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
      console.error('Database getPages error:', error);
      return [];
    }
  }

  // 管理员专用：批量删除评论
  async batchDeleteComments(ids) {
    try {
      // 数据验证
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('无效的ID列表');
      }
      
      // 限制批量删除数量防止滥用
      if (ids.length > 100) {
        throw new Error('批量删除数量过多，最多100条');
      }
      
      // 验证所有ID都是数字
      const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
      if (validIds.length === 0) {
        throw new Error('无效的ID格式');
      }
      
      const placeholders = validIds.map(() => '?').join(',');
      const stmt = this.db.prepare(`DELETE FROM comments WHERE id IN (${placeholders})`);
      const result = await stmt.bind(...validIds).run();
      
      console.log(`批量删除成功: ${result.meta.changes} 条记录`);
      return result.meta.changes || 0;
    } catch (error) {
      console.error('Database batchDeleteComments error:', error);
      throw new Error(`批量删除失败：${error.message}`);
    }
  }

  // 管理员专用：删除页面所有评论
  async deletePageComments(pageUrl) {
    try {
      const stmt = this.db.prepare('DELETE FROM comments WHERE page_url = ?');
      const result = await stmt.bind(pageUrl).run();
      return result.meta.changes || 0;
    } catch (error) {
      console.error('Database deletePageComments error:', error);
      return 0;
    }
  }

  // 白名单相关方法
  async getWhitelist() {
    try {
      const stmt = this.db.prepare('SELECT * FROM whitelist ORDER BY created_at DESC');
      const result = await stmt.all();
      return result.results || [];
    } catch (error) {
      console.error('Database getWhitelist error:', error);
      return [];
    }
  }

  async addToWhitelist(domain, description = null) {
    try {
      // 数据验证
      if (!domain || typeof domain !== 'string') {
        throw new Error('域名不能为空');
      }
      
      // 域名长度限制
      if (domain.length > 253) {
        throw new Error('域名过长');
      }
      
      // 域名格式验证
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*$/;
      if (!domainRegex.test(domain)) {
        throw new Error('域名格式不正确');
      }
      
      // 标准化域名
      const normalizedDomain = domain.toLowerCase().trim();
      
      // 描述长度限制
      if (description && description.length > 255) {
        throw new Error('描述过长');
      }
      
      const stmt = this.db.prepare('INSERT INTO whitelist (domain, description) VALUES (?, ?)');
      const result = await stmt.bind(normalizedDomain, description).run();
      
      console.log(`添加白名单成功: ${normalizedDomain}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error('Database addToWhitelist error:', error);
      throw new Error(`添加白名单失败：${error.message}`);
    }
  }

  async removeFromWhitelist(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM whitelist WHERE id = ?');
      const result = await stmt.bind(id).run();
      return result.meta.changes > 0;
    } catch (error) {
      console.error('Database removeFromWhitelist error:', error);
      return false;
    }
  }

  async isWhitelisted(domain) {
    try {
      if (!domain || typeof domain !== 'string') {
        return false;
      }
      
      // 标准化域名
      const normalizedDomain = domain.toLowerCase().trim();
      
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM whitelist WHERE domain = ?');
      const result = await stmt.bind(normalizedDomain).first();
      
      return result?.count > 0;
    } catch (error) {
      console.error('Database isWhitelisted error:', error);
      return false;
    }
  }

  // 速率限制相关方法
  async checkRateLimit(ipHash, maxRequests = 10, windowMinutes = 1) {
    try {
      // 清理过期记录
      await this.cleanOldRateLimits(windowMinutes);
      
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      
      // 检查当前窗口内的请求数
      const stmt = this.db.prepare(`
        SELECT request_count 
        FROM rate_limits 
        WHERE ip_hash = ? AND window_start > ?
      `);
      const result = await stmt.bind(ipHash, windowStart).first();
      
      if (!result) {
        // 没有记录，创建新记录
        await this.createRateLimit(ipHash);
        return true;
      }
      
      if (result.request_count >= maxRequests) {
        return false;
      }
      
      // 更新请求计数
      await this.updateRateLimit(ipHash);
      return true;
    } catch (error) {
      console.error('Database checkRateLimit error:', error);
      return true; // 出错时允许请求
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
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const stmt = this.db.prepare('DELETE FROM rate_limits WHERE window_start < ?');
    await stmt.bind(cutoff).run();
  }
}