import { query, queryOne, run } from '../db/database.js';

export interface FraudAlertRecord {
  id: string;
  userId: string;
  alertType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  createdAt: string;
}

export class FraudService {
  public static checkTransferRisk(userId: string, amountMB: number): { allowed: boolean; reason?: string } {
    // 1. Single transaction limit check
    const singleLimitSetting = queryOne<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'maxSingleTransferMB';"
    );
    const maxSingle = singleLimitSetting ? parseInt(singleLimitSetting.value, 10) : 5120; // 5 GB
    if (amountMB > maxSingle) {
      this.logAlert({
        userId,
        alertType: 'EXCESSIVE_SINGLE_TRANSFER',
        description: `Attempted transfer of ${amountMB} MB exceeds single limit of ${maxSingle} MB`,
        severity: 'MEDIUM'
      });
      return {
        allowed: false,
        reason: `Transfer amount (${(amountMB / 1024).toFixed(1)} GB) exceeds single transaction limit of ${(maxSingle / 1024).toFixed(1)} GB.`
      };
    }

    // 2. Daily volume check (last 24 hours)
    const dailyLimitSetting = queryOne<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'maxDailyTransferMB';"
    );
    const maxDaily = dailyLimitSetting ? parseInt(dailyLimitSetting.value, 10) : 10240; // 10 GB

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sentTodayRow = queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amountMB), 0) as total
       FROM transactions
       WHERE senderId = ? AND status = 'COMPLETED' AND createdAt >= ?;`,
      [userId, oneDayAgo]
    );

    const sentToday = sentTodayRow ? sentTodayRow.total : 0;
    if (sentToday + amountMB > maxDaily) {
      this.logAlert({
        userId,
        alertType: 'DAILY_TRANSFER_LIMIT_EXCEEDED',
        description: `Daily transfer volume would reach ${sentToday + amountMB} MB, exceeding ${maxDaily} MB limit`,
        severity: 'HIGH'
      });
      return {
        allowed: false,
        reason: `Daily transfer limit reached. You have transferred ${(sentToday / 1024).toFixed(1)} GB today. Daily limit is ${(maxDaily / 1024).toFixed(1)} GB.`
      };
    }

    // 3. Rapid frequency velocity check (more than 5 transfers in 60 seconds)
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const recentTxCountRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM transactions
       WHERE senderId = ? AND createdAt >= ?;`,
      [userId, oneMinAgo]
    );

    if (recentTxCountRow && recentTxCountRow.count >= 5) {
      this.logAlert({
        userId,
        alertType: 'RAPID_TRANSACTION_SPIKE',
        description: `High velocity activity: ${recentTxCountRow.count} transfers in under 60 seconds.`,
        severity: 'CRITICAL'
      });
      return {
        allowed: false,
        reason: 'Too many rapid requests. Please wait a minute before making another data transfer.'
      };
    }

    return { allowed: true };
  }

  public static logAlert(params: {
    userId: string;
    alertType: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): void {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    run(
      `INSERT INTO fraud_alerts (id, userId, alertType, description, severity, status, createdAt)
       VALUES (?, ?, ?, ?, ?, 'OPEN', ?);`,
      [id, params.userId, params.alertType, params.description, params.severity, now]
    );
  }

  public static getAlerts(): FraudAlertRecord[] {
    return query<FraudAlertRecord>(
      'SELECT * FROM fraud_alerts ORDER BY createdAt DESC LIMIT 100;'
    );
  }

  public static updateAlertStatus(id: string, status: string): boolean {
    const res = run(
      'UPDATE fraud_alerts SET status = ? WHERE id = ?;',
      [status, id]
    );
    return res.changes > 0;
  }
}
