import { query, queryOne, run } from '../db/database.js';

export class AdminService {
  public static getDashboardMetrics() {
    const totalUsers = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "USER";')?.count || 0;
    const totalSharedMB = queryOne<{ total: number }>('SELECT COALESCE(SUM(amountMB), 0) as total FROM transactions WHERE status = "COMPLETED";')?.total || 0;
    const poolData = queryOne<{ totalAvailableMB: number; totalContributedMB: number; totalDistributedMB: number }>(
      'SELECT totalAvailableMB, totalContributedMB, totalDistributedMB FROM data_pool WHERE id = 1;'
    ) || { totalAvailableMB: 0, totalContributedMB: 0, totalDistributedMB: 0 };
    const totalCoinsEarned = queryOne<{ total: number }>('SELECT COALESCE(SUM(totalEarned), 0) as total FROM coin_wallets;')?.total || 0;
    const totalCoinsSpent = queryOne<{ total: number }>('SELECT COALESCE(SUM(totalSpent), 0) as total FROM coin_wallets;')?.total || 0;
    const totalTransactions = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM transactions;')?.count || 0;
    const totalRecharges = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM recharge_transactions;')?.count || 0;
    const totalRedemptions = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM reward_redemptions;')?.count || 0;
    const openFraudAlerts = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM fraud_alerts WHERE status = "OPEN";')?.count || 0;

    return {
      totalUsers,
      totalSharedMB,
      totalSharedGB: Math.round(totalSharedMB / 1024),
      poolAvailableMB: poolData.totalAvailableMB,
      poolAvailableGB: (poolData.totalAvailableMB / 1024).toFixed(1),
      poolContributedMB: poolData.totalContributedMB,
      poolDistributedMB: poolData.totalDistributedMB,
      totalCoinsEarned,
      totalCoinsSpent,
      totalTransactions,
      totalRecharges,
      totalRedemptions,
      openFraudAlerts
    };
  }

  public static listUsers(limit = 100) {
    return query(
      `SELECT u.id, u.fullName, u.phone, u.email, u.role, u.status, u.createdAt,
              w.remainingDataMB, w.shareableDataMB, w.totalSharedDataMB, w.totalReceivedDataMB,
              c.coinBalance, c.totalEarned,
              p.planName, p.operatorId
       FROM users u
       LEFT JOIN data_wallets w ON u.id = w.userId
       LEFT JOIN coin_wallets c ON u.id = c.userId
       LEFT JOIN user_plans p ON u.id = p.userId AND p.status = 'ACTIVE'
       ORDER BY u.createdAt DESC
       LIMIT ?;`,
      [limit]
    );
  }

  public static toggleUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const res = run('UPDATE users SET status = ?, updatedAt = ? WHERE id = ?;', [
      status,
      new Date().toISOString(),
      userId
    ]);
    return res.changes > 0;
  }

  public static getSystemSettings() {
    return query('SELECT * FROM system_settings;');
  }

  public static updateSystemSetting(key: string, value: string) {
    const res = run(
      'UPDATE system_settings SET value = ?, updatedAt = ? WHERE key = ?;',
      [value, new Date().toISOString(), key]
    );
    return res.changes > 0;
  }

  public static updateRewardStock(rewardId: string, stock: number) {
    const res = run(
      'UPDATE rewards SET stock = ?, updatedAt = ? WHERE id = ?;',
      [stock, new Date().toISOString(), rewardId]
    );
    return res.changes > 0;
  }

  public static createReward(params: {
    name: string;
    category: string;
    description: string;
    coinCost: number;
    cashValue: number;
    stock: number;
    imageUrl?: string;
    terms?: string;
  }) {
    const id = `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    run(
      `INSERT INTO rewards (id, name, category, description, coinCost, cashValue, status, stock, imageUrl, terms, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?);`,
      [
        id,
        params.name,
        params.category,
        params.description,
        params.coinCost,
        params.cashValue,
        params.stock,
        params.imageUrl || '🎁',
        params.terms || null,
        now,
        now
      ]
    );
    return queryOne('SELECT * FROM rewards WHERE id = ?;', [id]);
  }
}
