-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_url TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_qq TEXT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  is_approved INTEGER DEFAULT 1,
  parent_id INTEGER,
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_page_url ON comments(page_url);
CREATE INDEX IF NOT EXISTS idx_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_parent_id ON comments(parent_id);

-- 站点配置表（可选，用于存储站点级别的设置）
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT OR IGNORE INTO site_config (config_key, config_value) VALUES
('max_comment_length', '1000'),
('require_approval', '0'),
('allow_guest_comments', '1');

-- 白名单表
CREATE TABLE IF NOT EXISTS whitelist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建白名单索引
CREATE INDEX IF NOT EXISTS idx_whitelist_domain ON whitelist(domain);

-- 速率限制表
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建速率限制索引
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);