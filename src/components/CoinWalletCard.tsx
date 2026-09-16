import React from 'react';
import { Coins, Smartphone, ShoppingBag, ArrowUpRight, Award, TrendingUp } from 'lucide-react';
import { CoinWallet } from '../types';

interface CoinWalletCardProps {
  coinWallet: CoinWallet | null;
  onRechargeClick: () => void;
  onRewardsClick: () => void;
  onHistoryClick: () => void;
}

export const CoinWalletCard: React.FC<CoinWalletCardProps> = ({
  coinWallet,
  onRechargeClick,
  onRewardsClick,
  onHistoryClick
}) => {
  const balance = coinWallet ? coinWallet.coinBalance : 0;
  const totalEarned = coinWallet ? coinWallet.totalEarned : 0;
  const totalSpent = coinWallet ? coinWallet.totalSpent : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800/90 rounded-3xl p-6 shadow-xl shadow-amber-950/10 text-white relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Reward Coin Wallet</h3>
            <p className="text-xs text-slate-400">Earned automatically by sharing data</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
          <Award className="w-3.5 h-3.5" />
          1 GB = 10 Coins
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="my-5 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Current Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-amber-400">{balance}</span>
            <span className="text-sm font-bold text-amber-500/80">Coins</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Lifetime Earned: <strong className="text-emerald-400 font-bold">{totalEarned}</strong>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Total Redeemed: <strong className="text-rose-400 font-bold">{totalSpent}</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          id="btn-coin-recharge"
          onClick={onRechargeClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 active:scale-98 transition-all"
        >
          <Smartphone className="w-4 h-4" />
          Virtual Recharge
        </button>

        <button
          id="btn-coin-rewards"
          onClick={onRewardsClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white active:scale-98 transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-cyan-400" />
          Shop Rewards
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
        <button
          onClick={onHistoryClick}
          className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 font-medium transition-colors"
        >
          View Coin Ledger & History <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
