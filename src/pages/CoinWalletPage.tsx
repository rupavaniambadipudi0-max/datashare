import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, TrendingUp, TrendingDown, ArrowUpRight, Smartphone, ShoppingBag, Clock } from 'lucide-react';
import { api } from '../api/client';
import { CoinTransaction } from '../types';

interface CoinWalletPageProps {
  onNavigateTab: (tab: string) => void;
}

export const CoinWalletPage: React.FC<CoinWalletPageProps> = ({ onNavigateTab }) => {
  const { coinWallet, refreshUser } = useAuth();
  const [history, setHistory] = useState<CoinTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoinHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCoinHistory(50);
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load coin history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoinHistory();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Reward Coins</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> 1 GB = 10 Coins
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Earned on every gigabyte shared or contributed to the pool
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('recharge')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <Smartphone className="w-4 h-4" /> Virtual Recharge
          </button>
          <button
            onClick={() => onNavigateTab('rewards')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" /> Shop Rewards
          </button>
        </div>
      </div>

      {/* Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Available Coins Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400">
              {coinWallet ? coinWallet.coinBalance : 0}
            </span>
            <span className="text-sm font-semibold text-amber-500/80">Coins</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Ready to spend on recharges & vouchers</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Lifetime Earned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400">
              {coinWallet ? coinWallet.totalEarned : 0}
            </span>
            <span className="text-sm font-semibold text-emerald-500/80">Coins</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total rewards accumulated
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Total Spent / Redeemed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-400">
              {coinWallet ? coinWallet.totalSpent : 0}
            </span>
            <span className="text-sm font-semibold text-rose-500/80">Coins</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Spent on vouchers & recharges
          </p>
        </div>
      </div>

      {/* Ledger */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-base text-white">Coin Activity Ledger</h3>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No coin transactions found. Start sharing data to earn coins!
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {history.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {tx.type} &bull; {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold text-sm ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCredit ? `+${tx.amount}` : tx.amount} Coins
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Balance: {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
