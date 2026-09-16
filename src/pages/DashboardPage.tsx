import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataWalletCard } from '../components/DataWalletCard';
import { CoinWalletCard } from '../components/CoinWalletCard';
import { PoolCard } from '../components/PoolCard';
import { SendDataModal } from '../components/SendDataModal';
import { RequestDataModal } from '../components/RequestDataModal';
import { ContributePoolModal } from '../components/ContributePoolModal';
import { WithdrawPoolModal } from '../components/WithdrawPoolModal';
import { api } from '../api/client';
import { DataPool, Transaction } from '../types';
import { ArrowUpRight, Clock, ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon, HeartHandshake } from 'lucide-react';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user, wallet, plan, coinWallet, refreshUser } = useAuth();
  const [pool, setPool] = useState<DataPool | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Modals
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isPoolDonateOpen, setIsPoolDonateOpen] = useState(false);
  const [isPoolWithdrawOpen, setIsPoolWithdrawOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [poolRes, txRes] = await Promise.all([
        api.getPoolStatus(),
        api.getTransactions('ALL', 5)
      ]);

      if (poolRes.success && poolRes.data) {
        setPool(poolRes.data.pool);
      }
      if (txRes.success && txRes.data) {
        setRecentTransactions(txRes.data);
      }
    } catch (err) {
      console.error('Failed fetching dashboard extras:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleActionSuccess = () => {
    fetchDashboardData();
    refreshUser();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Welcome back, {user?.fullName || 'User'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mobile Number: <strong className="text-slate-200 font-mono">{user?.phone}</strong> &bull; Operator:{' '}
            <strong className="text-cyan-400">{plan?.operatorName || '4G/5G Network'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSendOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all shadow-md shadow-cyan-500/20"
          >
            Send Data
          </button>
          <button
            onClick={() => onNavigateTab('recharge')}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-500/30 transition-all"
          >
            Virtual Recharge
          </button>
        </div>
      </div>

      {/* Main Wallet Card */}
      <DataWalletCard
        wallet={wallet}
        plan={plan}
        onSendClick={() => setIsSendOpen(true)}
        onRequestClick={() => setIsRequestOpen(true)}
        onPoolClick={() => setIsPoolDonateOpen(true)}
      />

      {/* Secondary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coin Rewards Wallet */}
        <CoinWalletCard
          coinWallet={coinWallet}
          onRechargeClick={() => onNavigateTab('recharge')}
          onRewardsClick={() => onNavigateTab('rewards')}
          onHistoryClick={() => onNavigateTab('coin-wallet')}
        />

        {/* Community Data Pool */}
        <PoolCard
          pool={pool}
          onDonateClick={() => setIsPoolDonateOpen(true)}
          onWithdrawClick={() => setIsPoolWithdrawOpen(true)}
        />
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Recent Transactions</h3>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No transactions yet. Try transferring data or donating to the pool!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => {
              const isSender = tx.senderId === user?.id;
              const formattedGB = (tx.amountMB / 1024).toFixed(tx.amountMB % 1024 === 0 ? 0 : 1);

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        tx.type === 'PEER_TRANSFER'
                          ? isSender
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'POOL_CONTRIBUTION'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {tx.type === 'PEER_TRANSFER' ? (
                        isSender ? <ArrowUpRightIcon className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <HeartHandshake className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-white">
                        {tx.type === 'PEER_TRANSFER'
                          ? isSender
                            ? `Sent to ${tx.receiverName || tx.receiverPhone || 'Peer'}`
                            : `Received from ${tx.senderName || tx.senderPhone || 'Peer'}`
                          : tx.type === 'POOL_CONTRIBUTION'
                          ? 'Donated to Community Pool'
                          : 'Claimed from Community Pool'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {tx.transactionId} &bull; {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'PEER_TRANSFER'
                          ? isSender
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : tx.type === 'POOL_CONTRIBUTION'
                          ? 'text-indigo-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'PEER_TRANSFER'
                        ? isSender ? `-${formattedGB} GB` : `+${formattedGB} GB`
                        : tx.type === 'POOL_CONTRIBUTION'
                        ? `-${formattedGB} GB`
                        : `+${formattedGB} GB`}
                    </span>
                    <span className="block text-[10px] text-emerald-400/90 font-medium">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SendDataModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <RequestDataModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <ContributePoolModal
        isOpen={isPoolDonateOpen}
        onClose={() => setIsPoolDonateOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <WithdrawPoolModal
        isOpen={isPoolWithdrawOpen}
        pool={pool}
        onClose={() => setIsPoolWithdrawOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};
