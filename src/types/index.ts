export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: string;
}

export interface UserPlan {
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
}

export interface DataWallet {
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

export interface CoinWallet {
  id: string;
  userId: string;
  coinBalance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataPool {
  id: number;
  totalAvailableMB: number;
  totalContributedMB: number;
  totalDistributedMB: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  transactionId: string;
  type: 'PEER_TRANSFER' | 'POOL_CONTRIBUTION' | 'POOL_WITHDRAWAL';
  senderId: string | null;
  receiverId: string | null;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  amountMB: number;
  requestId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  referenceId: string | null;
  createdAt: string;
}

export interface DataRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterPhone?: string;
  targetPhone: string;
  targetUserId: string | null;
  targetName?: string;
  amountMB: number;
  note: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  category: string;
  description: string;
  coinCost: number;
  cashValue: number;
  status: string;
  stock: number;
  imageUrl: string | null;
  terms: string | null;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardName?: string;
  rewardCategory?: string;
  coinsSpent: number;
  couponCode: string;
  status: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: number;
  link: string | null;
  createdAt: string;
}

export interface RechargePlan {
  id: string;
  name: string;
  amountINR: number;
  coinCost: number;
  validity: string;
  benefits: string;
  dataBonusMB?: number;
}

export interface RechargeTransaction {
  id: string;
  userId: string;
  phone: string;
  operator: string;
  planName: string;
  amountINR: number;
  coinsSpent: number;
  status: string;
  referenceNumber: string;
  createdAt: string;
}
