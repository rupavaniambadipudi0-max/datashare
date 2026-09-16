import { query, queryOne, run } from '../db/database.js';
import { realtimeService } from './realtimeService.js';

export interface CoinWalletRecord {
  id: string;
  userId: string;
  coinBalance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoinTransactionRecord {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  referenceId: string | null;
  createdAt: string;
}

export class CoinService {
  public static getWallet(userId: string): CoinWalletRecord {
    let wallet = queryOne<CoinWalletRecord>(
      'SELECT * FROM coin_wallets WHERE userId = ?;',
      [userId]
    );

    if (!wallet) {
      const now = new Date().toISOString();
      const id = `coin_${userId}`;
      run(
        `INSERT INTO coin_wallets (id, userId, coinBalance, totalEarned, totalSpent, createdAt, updatedAt)
         VALUES (?, ?, 0, 0, 0, ?, ?);`,
        [id, userId, now, now]
      );
      wallet = queryOne<CoinWalletRecord>(
        'SELECT * FROM coin_wallets WHERE userId = ?;',
        [userId]
      )!;
    }
    return wallet;
  }

  public static getRewardRate(): number {
    const setting = queryOne<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'rewardRateCoinsPerGB';"
    );
    return setting ? parseInt(setting.value, 10) || 10 : 10;
  }

  public static calculateRewardCoins(amountMB: number): number {
    const ratePerGB = this.getRewardRate();
    // 1 GB = 1024 MB => e.g., 2048 MB = 2 * 10 = 20 coins
    return Math.floor((amountMB / 1024) * ratePerGB);
  }

  public static getCoinHistory(userId: string, limit = 50): CoinTransactionRecord[] {
    return query<CoinTransactionRecord>(
      'SELECT * FROM coin_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ?;',
      [userId, limit]
    );
  }

  public static awardCoins(params: {
    userId: string;
    amount: number;
    type: string;
    description: string;
    referenceId?: string;
  }): CoinWalletRecord {
    if (params.amount <= 0) {
      return this.getWallet(params.userId);
    }

    const currentWallet = this.getWallet(params.userId);
    const newBalance = currentWallet.coinBalance + params.amount;
    const newTotalEarned = currentWallet.totalEarned + params.amount;
    const now = new Date().toISOString();

    run(
      `UPDATE coin_wallets
       SET coinBalance = ?, totalEarned = ?, updatedAt = ?
       WHERE userId = ?;`,
      [newBalance, newTotalEarned, now, params.userId]
    );

    const txId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    run(
      `INSERT INTO coin_transactions (id, userId, amount, type, description, balanceAfter, referenceId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        txId,
        params.userId,
        params.amount,
        params.type,
        params.description,
        newBalance,
        params.referenceId || null,
        now
      ]
    );

    const updated = this.getWallet(params.userId);
    realtimeService.emitToUser(params.userId, 'COINS_EARNED', {
      wallet: updated,
      earned: params.amount,
      type: params.type
    });

    return updated;
  }

  public static spendCoins(params: {
    userId: string;
    amount: number;
    type: string;
    description: string;
    referenceId?: string;
  }): CoinWalletRecord {
    if (params.amount <= 0) {
      throw new Error('Coin spend amount must be strictly greater than zero.');
    }

    const currentWallet = this.getWallet(params.userId);
    if (currentWallet.coinBalance < params.amount) {
      throw new Error(
        `Insufficient coin balance. Required: ${params.amount}, Available: ${currentWallet.coinBalance}`
      );
    }

    const newBalance = currentWallet.coinBalance - params.amount;
    const newTotalSpent = currentWallet.totalSpent + params.amount;
    const now = new Date().toISOString();

    run(
      `UPDATE coin_wallets
       SET coinBalance = ?, totalSpent = ?, updatedAt = ?
       WHERE userId = ?;`,
      [newBalance, newTotalSpent, now, params.userId]
    );

    const txId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    run(
      `INSERT INTO coin_transactions (id, userId, amount, type, description, balanceAfter, referenceId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        txId,
        params.userId,
        -params.amount,
        params.type,
        params.description,
        newBalance,
        params.referenceId || null,
        now
      ]
    );

    const updated = this.getWallet(params.userId);
    realtimeService.emitToUser(params.userId, 'COINS_SPENT', {
      wallet: updated,
      spent: params.amount,
      type: params.type
    });

    return updated;
  }
}
