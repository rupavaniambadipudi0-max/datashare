import { queryOne, run, transaction } from '../db/database.js';
import { WalletService } from './walletService.js';
import { CoinService } from './coinService.js';
import { NotificationService } from './notificationService.js';
import { FraudService } from './fraudService.js';
import { realtimeService } from './realtimeService.js';

export interface SendDataParams {
  senderId: string;
  receiverPhone: string;
  amountMB: number;
  message?: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface SendDataResult {
  transactionId: string;
  amountMB: number;
  senderWallet: {
    remainingDataMB: number;
    shareableDataMB: number;
    totalSharedDataMB: number;
  };
  coinsEarned: number;
  receiver: {
    fullName: string;
    phone: string;
  };
  createdAt: string;
}

export class TransferService {
  public static executePeerTransfer(params: SendDataParams): SendDataResult {
    const { senderId, receiverPhone, amountMB, message, idempotencyKey, requestId } = params;

    // 1. Validate Amount
    if (!amountMB || typeof amountMB !== 'number' || amountMB <= 0 || !Number.isInteger(amountMB)) {
      throw new Error('Transfer amount must be a positive integer in Megabytes (MB).');
    }

    // 2. Lookup sender
    const sender = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE id = ?;',
      [senderId]
    );
    if (!sender) {
      throw new Error('Sender account not found.');
    }

    // 3. Clean receiver phone and lookup
    const cleanPhone = receiverPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please provide a valid 10-digit mobile phone number.');
    }

    // 4. Prevent self-transfer
    if (cleanPhone === sender.phone.replace(/[^0-9]/g, '')) {
      throw new Error('Self-transfer is not permitted. You cannot send mobile data to your own number.');
    }

    const receiver = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE phone = ?;',
      [cleanPhone]
    );
    if (!receiver) {
      throw new Error(`Recipient with mobile number ${cleanPhone} is not registered on DataShare.`);
    }

    // 5. Check idempotency
    if (idempotencyKey) {
      const existingKey = queryOne<{ responseBody: string; statusCode: number }>(
        'SELECT responseBody, statusCode FROM idempotency_keys WHERE key = ? AND userId = ?;',
        [idempotencyKey, senderId]
      );
      if (existingKey) {
        return JSON.parse(existingKey.responseBody);
      }
    }

    // 6. Check Fraud & Risk limits
    const riskCheck = FraudService.checkTransferRisk(senderId, amountMB);
    if (!riskCheck.allowed) {
      throw new Error(riskCheck.reason || 'Transfer blocked by platform risk controls.');
    }

    // 7. Calculate backend rewards (e.g. 1 GB = 10 coins => 2048 MB = 20 coins)
    const coinsToAward = CoinService.calculateRewardCoins(amountMB);

    // 8. Execute Database Transaction Atomically
    const result = transaction<SendDataResult>(() => {
      // Re-query sender wallet within transaction lock to guarantee concurrency safety
      const senderWallet = queryOne<{
        remainingDataMB: number;
        shareableDataMB: number;
        totalSharedDataMB: number;
      }>('SELECT remainingDataMB, shareableDataMB, totalSharedDataMB FROM data_wallets WHERE userId = ?;', [senderId]);

      if (!senderWallet) {
        throw new Error('Sender wallet record missing.');
      }

      // 9. Balance verification
      if (senderWallet.remainingDataMB < amountMB) {
        throw new Error(
          `Insufficient remaining data. You have ${(senderWallet.remainingDataMB / 1024).toFixed(2)} GB remaining, but attempted to send ${(amountMB / 1024).toFixed(2)} GB.`
        );
      }

      if (senderWallet.shareableDataMB < amountMB) {
        throw new Error(
          `Insufficient shareable data. You have ${(senderWallet.shareableDataMB / 1024).toFixed(2)} GB shareable data, but attempted to send ${(amountMB / 1024).toFixed(2)} GB.`
        );
      }

      // Re-query receiver wallet
      const receiverWallet = queryOne<{
        remainingDataMB: number;
        receivedDataMB: number;
        totalReceivedDataMB: number;
      }>('SELECT remainingDataMB, receivedDataMB, totalReceivedDataMB FROM data_wallets WHERE userId = ?;', [receiver.id]);

      if (!receiverWallet) {
        throw new Error('Recipient wallet record missing.');
      }

      const now = new Date().toISOString();
      const newSenderRemaining = senderWallet.remainingDataMB - amountMB;
      const newSenderShareable = senderWallet.shareableDataMB - amountMB;
      const newSenderTotalShared = senderWallet.totalSharedDataMB + amountMB;

      const newReceiverRemaining = receiverWallet.remainingDataMB + amountMB;
      const newReceiverReceived = receiverWallet.receivedDataMB + amountMB;
      const newReceiverTotalReceived = receiverWallet.totalReceivedDataMB + amountMB;

      // Deduct sender
      run(
        `UPDATE data_wallets
         SET remainingDataMB = ?, shareableDataMB = ?, totalSharedDataMB = ?, updatedAt = ?
         WHERE userId = ?;`,
        [newSenderRemaining, newSenderShareable, newSenderTotalShared, now, senderId]
      );

      // Sync user plan if active
      run(
        `UPDATE user_plans
         SET remainingDataMB = ?, shareableDataMB = ?, updatedAt = ?
         WHERE userId = ? AND status = 'ACTIVE';`,
        [newSenderRemaining, newSenderShareable, now, senderId]
      );

      // Credit receiver
      run(
        `UPDATE data_wallets
         SET remainingDataMB = ?, receivedDataMB = ?, totalReceivedDataMB = ?, updatedAt = ?
         WHERE userId = ?;`,
        [newReceiverRemaining, newReceiverReceived, newReceiverTotalReceived, now, receiver.id]
      );

      // Create data transaction record
      const internalId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const readableTxId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      run(
        `INSERT INTO transactions (id, transactionId, type, senderId, receiverId, amountMB, requestId, status, note, createdAt, updatedAt)
         VALUES (?, ?, 'PEER_TRANSFER', ?, ?, ?, ?, 'COMPLETED', ?, ?, ?);`,
        [internalId, readableTxId, senderId, receiver.id, amountMB, requestId || null, message || null, now, now]
      );

      // Award coins to sender
      if (coinsToAward > 0) {
        CoinService.awardCoins({
          userId: senderId,
          amount: coinsToAward,
          type: 'DATA_TRANSFER_REWARD',
          description: `Reward for sharing ${(amountMB / 1024).toFixed(1)} GB with ${receiver.fullName}`,
          referenceId: readableTxId
        });
      }

      // Notifications
      const formattedData = amountMB >= 1024
        ? `${(amountMB / 1024).toFixed(amountMB % 1024 === 0 ? 0 : 1)} GB`
        : `${amountMB} MB`;

      NotificationService.create({
        userId: senderId,
        title: 'Data Sent Successfully',
        message: `You successfully transferred ${formattedData} to ${receiver.fullName} (${cleanPhone}). Earned ${coinsToAward} reward coins!`,
        type: 'DATA_SENT',
        link: '/transactions'
      });

      NotificationService.create({
        userId: receiver.id,
        title: 'Data Received!',
        message: `You received ${formattedData} mobile data from ${sender.fullName} (${sender.phone}). It has been added to your data wallet.`,
        type: 'DATA_RECEIVED',
        link: '/data-wallet'
      });

      const txResult: SendDataResult = {
        transactionId: readableTxId,
        amountMB,
        senderWallet: {
          remainingDataMB: newSenderRemaining,
          shareableDataMB: newSenderShareable,
          totalSharedDataMB: newSenderTotalShared
        },
        coinsEarned: coinsToAward,
        receiver: {
          fullName: receiver.fullName,
          phone: cleanPhone
        },
        createdAt: now
      };

      // Record Idempotency Key if provided
      if (idempotencyKey) {
        run(
          `INSERT OR REPLACE INTO idempotency_keys (key, userId, action, responseBody, statusCode, createdAt)
           VALUES (?, ?, 'SEND_DATA', ?, 200, ?);`,
          [idempotencyKey, senderId, JSON.stringify(txResult), now]
        );
      }

      return txResult;
    });

    // 10. Emit Realtime Events after DB commit
    realtimeService.emitToUser(senderId, 'DATA_SENT', result);
    realtimeService.emitToUser(senderId, 'WALLET_UPDATED', WalletService.getWallet(senderId));
    realtimeService.emitToUser(receiver.id, 'DATA_RECEIVED', {
      from: sender.fullName,
      amountMB,
      transactionId: result.transactionId
    });
    realtimeService.emitToUser(receiver.id, 'WALLET_UPDATED', WalletService.getWallet(receiver.id));

    return result;
  }
}
