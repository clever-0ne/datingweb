-- Tesla Capital — MySQL schema (from Archive 2 migrations)
-- Import this into MySQL, then point the app at it via .env.

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  two_factor_secret TEXT NULL,
  two_factor_recovery_codes TEXT NULL,
  account_bal DECIMAL(18,2) DEFAULT 0,
  roi DECIMAL(18,2) DEFAULT 0,
  bonus DECIMAL(18,2) DEFAULT 0,
  ref_bonus DECIMAL(18,2) DEFAULT 0,
  ref_link VARCHAR(255) NULL,
  ref_count INT DEFAULT 0,
  account_verify VARCHAR(20) DEFAULT 'Under Review',
  kyc_status VARCHAR(20) DEFAULT 'not_submitted',
  mining_balance DECIMAL(18,2) DEFAULT 0,
  mining_enabled TINYINT(1) DEFAULT 0,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(255) NULL,
  lastname VARCHAR(255) NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'Admin',
  dashboard_style VARCHAR(50) DEFAULT 'dark',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  min_amount DECIMAL(18,2) NOT NULL,
  max_amount DECIMAL(18,2) NULL,
  interest DECIMAL(8,2) NOT NULL,
  duration VARCHAR(50) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE user_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  active VARCHAR(10) DEFAULT 'yes',
  expire_date TIMESTAMP NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE deposits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  payment_method VARCHAR(100) NULL,
  status VARCHAR(20) DEFAULT 'pending',
  proof VARCHAR(255) NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE withdrawals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  method VARCHAR(100) NULL,
  wallet_address VARCHAR(255) NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP NULL
);

CREATE TABLE mining_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  coin VARCHAR(20) NOT NULL,
  hashrate DECIMAL(18,4) NOT NULL,
  hashrate_unit VARCHAR(20) DEFAULT 'TH/s',
  price DECIMAL(18,2) NOT NULL,
  net_payout DECIMAL(18,8) NOT NULL,
  payout_interval VARCHAR(20) DEFAULT 'daily',
  duration_days INT NOT NULL,
  electricity_cost DECIMAL(18,2) DEFAULT 0,
  break_even_days INT NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE user_miners (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  label VARCHAR(255) NULL,
  coin VARCHAR(20) NOT NULL,
  hashrate DECIMAL(18,4) NOT NULL,
  hashrate_unit VARCHAR(20) DEFAULT 'TH/s',
  price_paid DECIMAL(18,2) NOT NULL,
  net_payout DECIMAL(18,8) NOT NULL,
  payout_interval VARCHAR(20) DEFAULT 'daily',
  electricity_cost DECIMAL(18,2) DEFAULT 0,
  break_even_days INT NULL,
  status VARCHAR(20) DEFAULT 'active',
  profit_earned DECIMAL(18,8) DEFAULT 0,
  last_payout_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE cp_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NULL,
  message TEXT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL
);

CREATE TABLE kycs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP NULL
);

CREATE TABLE settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(255) DEFAULT 'Tesla Capital',
  s_currency VARCHAR(10) DEFAULT '$',
  minamt DECIMAL(18,2) DEFAULT 10,
  enable_with VARCHAR(10) DEFAULT 'true',
  enable_annoc VARCHAR(10) DEFAULT 'on',
  deposit_option VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP NULL
);

-- Password Reset Tokens (for forgot password)
CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Auth Codes (for 2FA - login, mining, investment)
CREATE TABLE auth_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'login', 'mining', 'investment'
  expires_at TIMESTAMP NOT NULL,
  verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, type)
);

-- Payouts (mining & investment)
CREATE TABLE payouts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'mining', 'investment'
  amount DECIMAL(18,2) NOT NULL,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, type)
);
