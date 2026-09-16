import { query, queryOne, run, transaction } from '../db/database.js';
import { WalletService } from './walletService.js';
import { CoinService } from './coinService.js';
import { NotificationService } from './notificationService.js';
import { realtimeService } from './realtimeService.js';

export interface DataPoolRecord {
  id: number;
  totalAvailableMB: number;
  totalContributedMB: number;
  totalDistributedMB: number;
  updatedAt: string;
}

export class PoolService {
  public static getPool(): DataPoolRecord {
    let pool = queryOne<DataPoolRecord>('SELECT * FROM data_pool WHERE id = 1;');
    if (!pool) {
      const now = new Date().toISOString();
      run(
        'INSERT INTO data_pool (id, totalAvailableMB, totalContributedMB, totalDistributedMB, updatedAt) VALUES (1, 0, 0, 0, ?);',
        [now]
      );
      pool = queryOne<DataPoolRecord>('SELECT * FROM data_pool WHERE id = 1;')!;
    }
    return pool;
  }

  public static contribute(userId: string, amountMB: number): {
    pool: DataPoolRecord;
    coinsEarned: number;
    wallet: any;
    transactionId: string;
  } {
    if (!amountMB || amountMB <= 0 || !Number.isInteger(amountMB)) {
      throw new Error('Contribution amount must be a positive integer in MB.');
    }

    const user = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE id = ?;',
      [userId]
    );
    if (!user) throw new Error('User not found.');

    const coinsToAward = CoinService.calculateRewardCoins(amountMB);

    const result = transaction(() => {
      // Re-query within transaction
      const wallet = queryOne<{
        remainingDataMB: number;
        shareableDataMB: number;
        totalSharedDataMB: number;
      }>('SELECT remainingDataMB, shareableDataMB, totalSharedDataMB FROM data_wallets WHERE userId = ?;', [userId]);

      if (!wallet) throw new Error('Data wallet not found.');

      if (wallet.remainingDataMB < amountMB) {
        throw new Error(
          `Insufficient remaining data. You have ${(wallet.remainingDataMB / 1024).toFixed(2)} GB, but requested to contribute ${(amountMB / 1024).toFixed(2)} GB.`
        );
      }

      if (wallet.shareableDataMB < amountMB) {
        throw new Error(
          `Insufficient shareable data. You have ${(wallet.shareableDataMB / 1024).toFixed(2)} GB shareable data, but requested to contribute ${(amountMB / 1024).toFixed(2)} GB.`
        );
      }

      const now = new Date().toISOString();
      const newRemaining = wallet.remainingDataMB - amountMB;
      const newShareable = wallet.shareableDataMB - amountMB;
      const newTotalShared = wallet.totalSharedDataMB + amountMB;

      // Update wallet
      run(
        `UPDATE data_wallets
         SET remainingDataMB = ?, shareableDataMB = ?, totalSharedDataMB = ?, updatedAt = ?
         WHERE userId = ?;`,
        [newRemaining, newShareable, newTotalShared, now, userId]
      );

      // Sync user plan
      run(
        `UPDATE user_plans
         SET remainingDataMB = ?, shareableDataMB = ?, updatedAt = ?
         WHERE userId = ? AND status = 'ACTIVE';`,
        [newRemaining, newShareable, now, userId]
      );

      // Update global pool
      const currentPool = this.getPool();
      const newAvailable = currentPool.totalAvailableMB + amountMB;
      const newContributed = currentPool.totalContributedMB + amountMB;

      run(
        `UPDATE data_pool
         SET totalAvailableMB = ?, totalContributedMB = ?, updatedAt = ?
         WHERE id = 1;`,
        [newAvailable, newContributed, now]
      );

      // Create transaction record
      const internalId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const readableTxId = `POOL-IN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      run(
        `INSERT INTO transactions (id, transactionId, type, senderId, receiverId, amountMB, requestId, status, note, createdAt, updatedAt)
         VALUES (?, ?, 'POOL_CONTRIBUTION', ?, NULL, ?, NULL, 'COMPLETED', 'Donated to community pool', ?, ?);`,
        [internalId, readableTxId, userId, amountMB, now, now]
      );

      // Award coins
      if (coinsToAward > 0) {
        CoinService.awardCoins({
          userId,
          amount: coinsToAward,
          type: 'POOL_CONTRIBUTION_REWARD',
          description: `Reward for donating ${(amountMB / 1024).toFixed(1)} GB to Community Data Pool`,
          referenceId: readableTxId
        });
      }

      const formattedData = amountMB >= 1024
        ? `${(amountMB / 1024).toFixed(amountMB % 1024 === 0 ? 0 : 1)} GB`
        : `${amountMB} MB`;

      NotificationService.create({
        userId,
        title: 'Community Pool Contribution',
        message: `Thank you for contributing ${formattedData} to the community data pool! You earned ${coinsToAward} reward coins.`,
        type: 'POOL_CONTRIBUTION',
        link: '/data-pool'
      });

      return {
        pool: this.getPool(),
        coinsEarned: coinsToAward,
        wallet: WalletService.getWallet(userId),
        transactionId: readableTxId
      };
    });

    realtimeService.broadcast('POOL_UPDATED', result.pool);
    realtimeService.emitToUser(userId, 'WALLET_UPDATED', result.wallet);

    return result;
  }

  public static withdraw(userId: string, amountMB: number): {
    pool: DataPoolRecord;
    wallet: any;
    transactionId: string;
  } {
    if (!amountMB || amountMB <= 0 || !Number.isInteger(amountMB)) {
      throw new Error('Withdrawal amount must be a positive integer in MB.');
    }

    const user = queryOne<{ id: string; fullName: string }>(
      'SELECT id, fullName FROM users WHERE id = ?;',
      [userId]
    );
    if (!user) throw new Error('User not found.');

    const result = transaction(() => {
      const pool = this.getPool();
      if (pool.totalAvailableMB < amountMB) {
        throw new Error(
          `Insufficient pool balance. Community pool currently has ${(pool.totalAvailableMB / 1024).toFixed(2)} GB, but requested ${(amountMB / 1024).toFixed(2)} GB.`
        );
      }

      const wallet = queryOne<{
        remainingDataMB: number;
        receivedDataMB: number;
        totalReceivedDataMB: number;
      }>('SELECT remainingDataMB, receivedDataMB, totalReceivedDataMB FROM data_wallets WHERE userId = ?;', [userId]);

      if (!wallet) throw new Error('User wallet not found.');

      const now = new Date().toISOString();
      const newPoolAvailable = pool.totalAvailableMB - amountMB;
      const newPoolDistributed = pool.totalDistributedMB + amountMB;

      // Update pool
      run(
        `UPDATE data_pool
         SET totalAvailableMB = ?, totalDistributedMB = ?, updatedAt = ?
         WHERE id = 1;`,
        [newPoolAvailable, newPoolDistributed, now]
      );

      // Update user wallet
      const newRemaining = wallet.remainingDataMB + amountMB;
      const newReceived = wallet.receivedDataMB + amountMB;
      const newTotalReceived = wallet.totalReceivedDataMB + amountMB;

      run(
        `UPDATE data_wallets
         SET remainingDataMB = ?, receivedDataMB = ?, totalReceivedDataMB = ?, updatedAt = ?
         WHERE userId = ?;`,
        [newRemaining, newReceived, newTotalReceived, now, userId]
      );

      // Create transaction
      const internalId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const readableTxId = `POOL-OUT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      run(
        `INSERT INTO transactions (id, transactionId, type, senderId, receiverId, amountMB, requestId, status, note, createdAt, updatedAt)
         VALUES (?, ?, 'POOL_WITHDRAWAL', NULL, ?, ?, NULL, 'COMPLETED', 'Withdrawn from community pool', ?, ?);`,
        [internalId, readableTxId, userId, amountMB, now, now]
      );

      const formattedData = amountMB >= 1024
        ? `${(amountMB / 1024).toFixed(amountMB % 1024 === 0 ? 0 : 1)} GB`
        : `${amountMB} MB`;

      NotificationService.create({
        userId,
        title: 'Community Pool Relief Received',
        message: `You successfully claimed ${formattedData} mobile data from the community pool! Added to your remaining data.`,
        type: 'POOL_WITHDRAWAL',
        link: '/data-wallet'
      });

      return {
        pool: this.getPool(),
        wallet: WalletService.getWallet(userId),
        transactionId: readableTxId
      };
    });

    realtimeService.broadcast('POOL_UPDATED', result.pool);
    realtimeService.emitToUser(userId, 'WALLET_UPDATED', result.wallet);

    return result;
  }
}
