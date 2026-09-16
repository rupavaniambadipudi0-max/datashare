import { queryOne, run } from '../db/database.js';
import { realtimeService } from './realtimeService.js';

export interface DataWalletRecord {
  id: string;
  userId: string;
  totalDataMB: number;
  usedDataMB: number;
  remainingDataMB: number;
  shareableDataMB: number;
  receivedDataMB: number;
  totalSharedDataMB: number;
  totalReceivedDataMB: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPlanRecord {
  id: string;
  userId: string;
  operatorId: string;
  operatorName?: string;
  operatorColor?: string;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  totalDataMB: number;
  usedDataMB: number;
  remainingDataMB: number;
  shareableDataMB: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class WalletService {
  public static getWallet(userId: string): DataWalletRecord {
    let wallet = queryOne<DataWalletRecord>(
      'SELECT * FROM data_wallets WHERE userId = ?;',
      [userId]
    );

    if (!wallet) {
      const now = new Date().toISOString();
      const id = `wal_${userId}`;
      run(
        `INSERT INTO data_wallets (
          id, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB,
          receivedDataMB, totalSharedDataMB, totalReceivedDataMB, createdAt, updatedAt
        ) VALUES (?, ?, 10240, 2048, 8192, 4096, 0, 0, 0, ?, ?);`,
        [id, userId, now, now]
      );
      wallet = queryOne<DataWalletRecord>(
        'SELECT * FROM data_wallets WHERE userId = ?;',
        [userId]
      )!;
    }

    return wallet;
  }

  public static getPlan(userId: string): UserPlanRecord | null {
    const plan = queryOne<UserPlanRecord>(
      `SELECT p.*, o.name as operatorName, o.color as operatorColor
       FROM user_plans p
       LEFT JOIN operators o ON p.operatorId = o.id
       WHERE p.userId = ? AND p.status = 'ACTIVE'
       ORDER BY p.createdAt DESC LIMIT 1;`,
      [userId]
    );
    return plan;
  }

  public static updateUsage(userId: string, consumeMB: number): DataWalletRecord {
    if (consumeMB <= 0) {
      throw new Error('Consumption MB must be strictly positive');
    }

    const wallet = this.getWallet(userId);
    if (wallet.remainingDataMB < consumeMB) {
      throw new Error(
        `Cannot consume ${consumeMB} MB: remaining data is only ${wallet.remainingDataMB} MB`
      );
    }

    const newRemaining = wallet.remainingDataMB - consumeMB;
    const newUsed = wallet.usedDataMB + consumeMB;
    // Shareable balance cannot exceed remaining data
    const newShareable = Math.min(wallet.shareableDataMB, newRemaining);
    const now = new Date().toISOString();

    run(
      `UPDATE data_wallets
       SET remainingDataMB = ?, usedDataMB = ?, shareableDataMB = ?, updatedAt = ?
       WHERE userId = ?;`,
      [newRemaining, newUsed, newShareable, now, userId]
    );

    // Also sync user plan if active
    run(
      `UPDATE user_plans
       SET remainingDataMB = ?, usedDataMB = ?, shareableDataMB = ?, updatedAt = ?
       WHERE userId = ? AND status = 'ACTIVE';`,
      [newRemaining, newUsed, newShareable, now, userId]
    );

    const updated = this.getWallet(userId);
    realtimeService.emitToUser(userId, 'WALLET_UPDATED', updated);
    return updated;
  }
}
