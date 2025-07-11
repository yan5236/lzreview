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

-- 通知配置表
CREATE TABLE IF NOT EXISTS notification_config (
  id INTEGER PRIMARY KEY,
  config_data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 邮件订阅表
CREATE TABLE IF NOT EXISTS email_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  page_url TEXT,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- 创建邮件订阅索引
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);

-- Telegram 订阅表
CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT UNIQUE NOT NULL,
  name TEXT,
  chat_type TEXT DEFAULT 'private',
  page_url TEXT,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- 创建 Telegram 订阅索引
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_chat_id ON telegram_subscribers(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_active ON telegram_subscribers(is_active);

-- 通知发送日志表（可选，用于记录发送历史）
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER,
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id)
);

-- 创建通知日志索引
CREATE INDEX IF NOT EXISTS idx_notification_logs_comment ON notification_logs(comment_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);