export const TOKEN_KEY = 'datashare_auth_token';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err: any) {
    throw err;
  }
}

// API methods
export const api = {
  // Auth
  sendOtp: (phone: string) =>
    apiRequest('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),

  verifyOtp: (phone: string, code: string) =>
    apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code })
    }),

  register: (data: any) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => apiRequest('/api/auth/me'),

  // Wallet
  getWallet: () => apiRequest('/api/wallet/me'),
  getOperators: () => apiRequest('/api/wallet/operators'),
  simulateUsage: (consumeMB: number) =>
    apiRequest('/api/wallet/simulate-usage', {
      method: 'POST',
      body: JSON.stringify({ consumeMB })
    }),

  // Data Transfers & Requests
  sendData: (data: { receiverPhone: string; amountMB: number; message?: string; idempotencyKey?: string }) =>
    apiRequest('/api/data/send', {
      method: 'POST',
      headers: data.idempotencyKey ? { 'x-idempotency-key': data.idempotencyKey } : undefined,
      body: JSON.stringify(data)
    }),

  createRequest: (data: { targetPhone: string; amountMB: number; note?: string }) =>
    apiRequest('/api/data/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getIncomingRequests: () => apiRequest('/api/data/requests/incoming'),
  getOutgoingRequests: () => apiRequest('/api/data/requests/outgoing'),
  acceptRequest: (id: string) =>
    apiRequest(`/api/data/requests/${id}/accept`, { method: 'POST' }),
  rejectRequest: (id: string) =>
    apiRequest(`/api/data/requests/${id}/reject`, { method: 'POST' }),
  cancelRequest: (id: string) =>
    apiRequest(`/api/data/requests/${id}/cancel`, { method: 'POST' }),

  // Data Pool
  getPoolStatus: () => apiRequest('/api/pool/status'),
  contributeToPool: (amountMB: number) =>
    apiRequest('/api/pool/contribute', {
      method: 'POST',
      body: JSON.stringify({ amountMB })
    }),
  withdrawFromPool: (amountMB: number) =>
    apiRequest('/api/pool/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amountMB })
    }),

  // Coins
  getCoinBalance: () => apiRequest('/api/coins/balance'),
  getCoinHistory: (limit?: number) =>
    apiRequest(`/api/coins/transactions${limit ? `?limit=${limit}` : ''}`),

  // Recharge
  getRechargePlans: () => apiRequest('/api/recharge/plans'),
  executeRecharge: (data: { phone: string; operator: string; planId: string }) =>
    apiRequest('/api/recharge', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getRechargeHistory: () => apiRequest('/api/recharge/transactions'),

  // Rewards
  getRewardsCatalog: (category?: string) =>
    apiRequest(`/api/rewards/catalog${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  redeemReward: (rewardId: string) =>
    apiRequest('/api/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ rewardId })
    }),
  getMyRedemptions: () => apiRequest('/api/rewards/my-redemptions'),

  // Transactions
  getTransactions: (type?: string, limit?: number) =>
    apiRequest(`/api/transactions?type=${type || 'ALL'}&limit=${limit || 50}`),
  getTransactionById: (id: string) => apiRequest(`/api/transactions/${id}`),

  // Notifications
  getNotifications: () => apiRequest('/api/notifications'),
  getUnreadNotificationsCount: () => apiRequest('/api/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    apiRequest(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    apiRequest('/api/notifications/read-all', { method: 'POST' }),

  // Admin
  getAdminMetrics: () => apiRequest('/api/admin/metrics'),
  getAdminUsers: () => apiRequest('/api/admin/users'),
  toggleUserStatus: (id: string, status: string) =>
    apiRequest(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),
  getAdminTransactions: () => apiRequest('/api/admin/transactions'),
  getAdminSettings: () => apiRequest('/api/admin/settings'),
  updateAdminSetting: (key: string, value: string) =>
    apiRequest('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    }),
  getAdminFraudAlerts: () => apiRequest('/api/admin/fraud-alerts'),
  updateFraudAlertStatus: (id: string, status: string) =>
    apiRequest(`/api/admin/fraud-alerts/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),
  updateRewardStock: (id: string, stock: number) =>
    apiRequest(`/api/admin/rewards/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ stock })
    })
};
