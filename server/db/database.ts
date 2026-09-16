import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.resolve(process.cwd(), 'datashare.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('[Database] Loaded existing database from disk:', DB_FILE_PATH);
    } catch (err) {
      console.error('[Database] Failed reading db file, creating new one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log('[Database] Created fresh in-memory database');
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('[Database] Error saving to disk:', err);
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

let transactionDepth = 0;

export function run(sql: string, params: any[] = []): { changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  if (transactionDepth === 0) {
    saveDb();
  }
  return { changes: dbInstance.getRowsModified() };
}

// Atomic transaction execution with automatic rollback on error and disk persistence
export function transaction<T>(fn: () => T): T {
  if (!dbInstance) throw new Error('Database not initialized');
  
  if (transactionDepth === 0) {
    dbInstance.exec('BEGIN TRANSACTION;');
  }
  transactionDepth++;

  try {
    const result = fn();
    transactionDepth--;
    if (transactionDepth === 0) {
      dbInstance.exec('COMMIT;');
      saveDb();
    }
    return result;
  } catch (err) {
    transactionDepth--;
    if (transactionDepth === 0) {
      try {
        dbInstance.exec('ROLLBACK;');
      } catch (rollbackErr) {
        console.error('[Database] Rollback error:', rollbackErr);
      }
    }
    throw err;
  }
}

function initSchema(db: Database): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- OTP Codes Table
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    -- Operators
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    -- User Plans
    CREATE TABLE IF NOT EXISTS user_plans (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      operatorId TEXT NOT NULL,
      planName TEXT NOT NULL,
      price INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      totalDataMB INTEGER NOT NULL CHECK (totalDataMB >= 0),
      usedDataMB INTEGER NOT NULL DEFAULT 0 CHECK (usedDataMB >= 0),
      remainingDataMB INTEGER NOT NULL CHECK (remainingDataMB >= 0),
      shareableDataMB INTEGER NOT NULL CHECK (shareableDataMB >= 0),
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Data Wallets (Authoritative)
    CREATE TABLE IF NOT EXISTS data_wallets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      totalDataMB INTEGER NOT NULL CHECK (totalDataMB >= 0),
      usedDataMB INTEGER NOT NULL DEFAULT 0 CHECK (usedDataMB >= 0),
      remainingDataMB INTEGER NOT NULL CHECK (remainingDataMB >= 0),
      shareableDataMB INTEGER NOT NULL CHECK (shareableDataMB >= 0),
      receivedDataMB INTEGER NOT NULL DEFAULT 0 CHECK (receivedDataMB >= 0),
      totalSharedDataMB INTEGER NOT NULL DEFAULT 0 CHECK (totalSharedDataMB >= 0),
      totalReceivedDataMB INTEGER NOT NULL DEFAULT 0 CHECK (totalReceivedDataMB >= 0),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Coin Wallets
    CREATE TABLE IF NOT EXISTS coin_wallets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      coinBalance INTEGER NOT NULL DEFAULT 0 CHECK (coinBalance >= 0),
      totalEarned INTEGER NOT NULL DEFAULT 0 CHECK (totalEarned >= 0),
      totalSpent INTEGER NOT NULL DEFAULT 0 CHECK (totalSpent >= 0),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Global Data Pool
    CREATE TABLE IF NOT EXISTS data_pool (
      id INTEGER PRIMARY KEY,
      totalAvailableMB INTEGER NOT NULL DEFAULT 0 CHECK (totalAvailableMB >= 0),
      totalContributedMB INTEGER NOT NULL DEFAULT 0 CHECK (totalContributedMB >= 0),
      totalDistributedMB INTEGER NOT NULL DEFAULT 0 CHECK (totalDistributedMB >= 0),
      updatedAt TEXT NOT NULL
    );

    -- Data Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transactionId TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, -- 'PEER_TRANSFER', 'POOL_CONTRIBUTION', 'POOL_WITHDRAWAL'
      senderId TEXT,
      receiverId TEXT,
      amountMB INTEGER NOT NULL CHECK (amountMB > 0),
      requestId TEXT,
      status TEXT NOT NULL, -- 'COMPLETED', 'FAILED', 'REJECTED'
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Coin Transactions Ledger
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount INTEGER NOT NULL, -- positive for credits, negative for debits
      type TEXT NOT NULL, -- 'DATA_TRANSFER_REWARD', 'POOL_CONTRIBUTION_REWARD', 'MOBILE_RECHARGE', 'SHOPPING_REDEMPTION', 'REWARD_REDEMPTION', 'ADMIN_ADJUSTMENT'
      description TEXT NOT NULL,
      balanceAfter INTEGER NOT NULL CHECK (balanceAfter >= 0),
      referenceId TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Data Requests
    CREATE TABLE IF NOT EXISTS data_requests (
      id TEXT PRIMARY KEY,
      requesterId TEXT NOT NULL,
      targetPhone TEXT NOT NULL,
      targetUserId TEXT,
      amountMB INTEGER NOT NULL CHECK (amountMB > 0),
      note TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'COMPLETED'
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Recharge Transactions
    CREATE TABLE IF NOT EXISTS recharge_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      phone TEXT NOT NULL,
      operator TEXT NOT NULL,
      planName TEXT NOT NULL,
      amountINR INTEGER NOT NULL,
      coinsSpent INTEGER NOT NULL CHECK (coinsSpent > 0),
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      referenceNumber TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Shopping Rewards Catalog
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Food', 'Shopping', 'OTT', 'Gift Cards', 'Mobile Recharge', 'Discounts'
      description TEXT NOT NULL,
      coinCost INTEGER NOT NULL CHECK (coinCost > 0),
      cashValue INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      stock INTEGER NOT NULL CHECK (stock >= 0),
      imageUrl TEXT,
      terms TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Reward Redemptions
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      rewardId TEXT NOT NULL,
      coinsSpent INTEGER NOT NULL,
      couponCode TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (rewardId) REFERENCES rewards(id) ON DELETE RESTRICT
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Fraud Alerts & Risk Controls
    CREATE TABLE IF NOT EXISTS fraud_alerts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      alertType TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'REVIEWED', 'DISMISSED'
      createdAt TEXT NOT NULL
    );

    -- Idempotency Keys Table
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      responseBody TEXT NOT NULL,
      statusCode INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );

    -- System Configuration
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updatedAt TEXT NOT NULL
    );

    -- Indexes for performance & rapid query lookups
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON data_wallets(userId);
    CREATE INDEX IF NOT EXISTS idx_coins_user ON coin_wallets(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(senderId);
    CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiverId);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(createdAt);
    CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_data_requests_target ON data_requests(targetPhone);
    CREATE INDEX IF NOT EXISTS idx_data_requests_requester ON data_requests(requesterId);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(userId, isRead);
  `);

  // Seed default operators if not present
  const opCount = db.exec('SELECT COUNT(*) as count FROM operators;')[0]?.values[0][0] as number;
  if (!opCount || opCount === 0) {
    db.run(`
      INSERT INTO operators (id, name, code, color, status) VALUES
      ('op_airtel', 'Airtel', 'AIRTEL', '#E11D48', 'ACTIVE'),
      ('op_jio', 'Jio', 'JIO', '#0284C7', 'ACTIVE'),
      ('op_vi', 'Vi', 'VI', '#D97706', 'ACTIVE'),
      ('op_bsnl', 'BSNL', 'BSNL', '#16A34A', 'ACTIVE');
    `);
  }

  // Seed default system settings if not present
  const settingsCount = db.exec('SELECT COUNT(*) as count FROM system_settings;')[0]?.values[0][0] as number;
  if (!settingsCount || settingsCount === 0) {
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO system_settings (key, value, description, updatedAt) VALUES
      ('rewardRateCoinsPerGB', '10', 'Number of reward coins awarded per 1 GB (1024 MB) transferred or contributed', '${now}'),
      ('maxSingleTransferMB', '5120', 'Maximum MB for a single transfer (5 GB)', '${now}'),
      ('maxDailyTransferMB', '10240', 'Maximum MB a user can transfer in 24 hours (10 GB)', '${now}'),
      ('dailyCoinEarnLimit', '1000', 'Maximum coins a user can earn per day', '${now}'),
      ('dailyCoinSpendLimit', '2000', 'Maximum coins a user can spend per day', '${now}');
    `);
  }

  // Seed initial Global Pool record
  const poolCount = db.exec('SELECT COUNT(*) as count FROM data_pool;')[0]?.values[0][0] as number;
  if (!poolCount || poolCount === 0) {
    db.run(`
      INSERT INTO data_pool (id, totalAvailableMB, totalContributedMB, totalDistributedMB, updatedAt)
      VALUES (1, 0, 0, 0, '${new Date().toISOString()}');
    `);
  }

  // Seed initial shopping rewards
  const rewardsCount = db.exec('SELECT COUNT(*) as count FROM rewards;')[0]?.values[0][0] as number;
  if (!rewardsCount || rewardsCount === 0) {
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO rewards (id, name, category, description, coinCost, cashValue, status, stock, imageUrl, terms, createdAt, updatedAt) VALUES
      ('rew_swiggy_50', 'Swiggy ₹50 Discount Voucher', 'Food', 'Get flat ₹50 off on your next delicious meal ordered through Swiggy food delivery.', 30, 50, 'ACTIVE', 50, '🍕', 'Valid on orders above ₹199. One redemption per user per week.', '${now}', '${now}'),
      ('rew_zomato_100', 'Zomato Pro ₹100 Off', 'Food', 'Save ₹100 on dining out or food delivery orders across all top partner restaurants.', 50, 100, 'ACTIVE', 40, '🍔', 'Valid on minimum order of ₹299.', '${now}', '${now}'),
      ('rew_hotstar_sub', 'Disney+ Hotstar 1-Month Mobile', 'OTT', 'Stream live cricket, blockbuster movies, and international TV series in HD.', 80, 149, 'ACTIVE', 25, '🎬', 'Applies to mobile plan subscription. Voucher code redeemable once.', '${now}', '${now}'),
      ('rew_amazon_50', 'Amazon Pay ₹50 Gift Card', 'Gift Cards', 'Instant ₹50 Amazon Pay balance for bill payments, shopping, or recharge.', 40, 50, 'ACTIVE', 60, '🎁', 'Can be added directly to Amazon Pay balance.', '${now}', '${now}'),
      ('rew_myntra_200', 'Myntra Fashion ₹200 Coupon', 'Shopping', 'Upgrade your wardrobe with flat ₹200 off on trending fashion and footwear.', 60, 200, 'ACTIVE', 35, '👗', 'Applicable on select styles on Myntra app.', '${now}', '${now}'),
      ('rew_starbucks_100', 'Starbucks ₹100 Beverage Off', 'Food', 'Enjoy handcrafted coffee with a flat ₹100 discount coupon code.', 50, 100, 'ACTIVE', 30, '☕', 'Valid at all participating Starbucks outlets across India.', '${now}', '${now}');
    `);
  }

  // Seed Admin user and initial test users if not present
  const adminUser = db.exec("SELECT id FROM users WHERE phone = '9999999999';")[0]?.values;
  if (!adminUser || adminUser.length === 0) {
    const now = new Date().toISOString();
    // Admin
    db.run(`
      INSERT INTO users (id, fullName, phone, email, role, status, createdAt, updatedAt)
      VALUES ('usr_admin', 'Admin User', '9999999999', 'admin@datashare.local', 'ADMIN', 'ACTIVE', '${now}', '${now}');
      INSERT INTO data_wallets (id, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, receivedDataMB, totalSharedDataMB, totalReceivedDataMB, createdAt, updatedAt)
      VALUES ('wal_admin', 'usr_admin', 51200, 5120, 46080, 25600, 0, 0, 0, '${now}', '${now}');
      INSERT INTO coin_wallets (id, userId, coinBalance, totalEarned, totalSpent, createdAt, updatedAt)
      VALUES ('coin_admin', 'usr_admin', 500, 500, 0, '${now}', '${now}');
    `);

    // Arjun (28 GB Total, 8 GB Used, 20 GB Remaining, 10 GB Shareable, 0 Coins)
    db.run(`
      INSERT INTO users (id, fullName, phone, email, role, status, createdAt, updatedAt)
      VALUES ('usr_arjun', 'Arjun Sharma', '9876543210', 'arjun@example.com', 'USER', 'ACTIVE', '${now}', '${now}');
      INSERT INTO user_plans (id, userId, operatorId, planName, price, startDate, endDate, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, status, createdAt, updatedAt)
      VALUES ('plan_arjun', 'usr_arjun', 'op_airtel', 'Airtel Truly Unlimited 28GB', 299, '2026-09-01', '2026-09-29', 28672, 8192, 20480, 10240, 'ACTIVE', '${now}', '${now}');
      INSERT INTO data_wallets (id, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, receivedDataMB, totalSharedDataMB, totalReceivedDataMB, createdAt, updatedAt)
      VALUES ('wal_arjun', 'usr_arjun', 28672, 8192, 20480, 10240, 0, 0, 0, '${now}', '${now}');
      INSERT INTO coin_wallets (id, userId, coinBalance, totalEarned, totalSpent, createdAt, updatedAt)
      VALUES ('coin_arjun', 'usr_arjun', 0, 0, 0, '${now}', '${now}');
    `);

    // Priya (5 GB Remaining, 2 GB Shareable, 0 Coins)
    db.run(`
      INSERT INTO users (id, fullName, phone, email, role, status, createdAt, updatedAt)
      VALUES ('usr_priya', 'Priya Patel', '9876543211', 'priya@example.com', 'USER', 'ACTIVE', '${now}', '${now}');
      INSERT INTO user_plans (id, userId, operatorId, planName, price, startDate, endDate, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, status, createdAt, updatedAt)
      VALUES ('plan_priya', 'usr_priya', 'op_jio', 'Jio Cricket Pack 10GB', 149, '2026-09-05', '2026-09-26', 10240, 5120, 5120, 2048, 'ACTIVE', '${now}', '${now}');
      INSERT INTO data_wallets (id, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, receivedDataMB, totalSharedDataMB, totalReceivedDataMB, createdAt, updatedAt)
      VALUES ('wal_priya', 'usr_priya', 10240, 5120, 5120, 2048, 0, 0, 0, '${now}', '${now}');
      INSERT INTO coin_wallets (id, userId, coinBalance, totalEarned, totalSpent, createdAt, updatedAt)
      VALUES ('coin_priya', 'usr_priya', 0, 0, 0, '${now}', '${now}');
    `);
  }
}
