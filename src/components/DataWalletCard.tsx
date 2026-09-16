import React from 'react';
import { Wifi, Send, ArrowDownLeft, HeartHandshake, ShieldCheck, Zap } from 'lucide-react';
import { DataWallet, UserPlan } from '../types';

interface DataWalletCardProps {
  wallet: DataWallet | null;
  plan: UserPlan | null;
  onSendClick: () => void;
  onRequestClick: () => void;
  onPoolClick: () => void;
}

export const DataWalletCard: React.FC<DataWalletCardProps> = ({
  wallet,
  plan,
  onSendClick,
  onRequestClick,
  onPoolClick
}) => {
  if (!wallet) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 animate-pulse">
        <div className="h-6 w-36 bg-slate-800 rounded mb-4"></div>
        <div className="h-16 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="h-4 w-full bg-slate-800 rounded"></div>
      </div>
    );
  }

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);
  const remainingGB = toGB(wallet.remainingDataMB);
  const shareableGB = toGB(wallet.shareableDataMB);
  const totalGB = toGB(wallet.totalDataMB);
  const usedGB = toGB(wallet.usedDataMB);
  const receivedGB = toGB(wallet.receivedDataMB);

  const percentUsed = wallet.totalDataMB > 0
    ? Math.min(100, Math.round((wallet.usedDataMB / wallet.totalDataMB) * 100))
    : 0;
  const percentShareable = wallet.totalDataMB > 0
    ? Math.min(100, Math.round((wallet.shareableDataMB / wallet.totalDataMB) * 100))
    : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-cyan-950/20 text-white">
      {/* Background soft glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Active Mobile Data Wallet</h2>
              {plan?.operatorName && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {plan.operatorName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {plan?.planName || 'Standard Unlimited Data Plan'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Authoritative DB Balance
        </div>
      </div>

      {/* Primary Balance Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 pt-2 relative z-10">
        {/* Remaining Data */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Total Remaining Data
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-white">{remainingGB}</span>
            <span className="text-lg font-semibold text-slate-400">GB</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span>Used: <strong className="text-slate-200">{usedGB} GB</strong></span>
            <span>&bull;</span>
            <span>Total: <strong className="text-slate-200">{totalGB} GB</strong></span>
          </div>
        </div>

        {/* Authoritative Shareable Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Shareable Balance
            </span>
            <span className="text-[10px] bg-cyan-400 text-slate-950 font-bold px-1.5 py-0.2 rounded">
              P2P & Pool
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-cyan-300">{shareableGB}</span>
            <span className="text-lg font-semibold text-cyan-400/80">GB</span>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Available to transfer to friends or donate to the community pool.
          </p>
        </div>
      </div>

      {/* Visual Usage Progress Bar */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Usage breakdown</span>
          <span>{percentUsed}% consumed &bull; {percentShareable}% shareable</span>
        </div>
        <div className="w-full h-3 bg-slate-800/90 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-700/60">
          {/* Used bar */}
          <div
            style={{ width: `${percentUsed}%` }}
            className="h-full bg-slate-500 rounded-l-full transition-all duration-500"
            title={`Used: ${usedGB} GB`}
          ></div>
          {/* Shareable bar */}
          <div
            style={{ width: `${percentShareable}%` }}
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
            title={`Shareable: ${shareableGB} GB`}
          ></div>
          {/* Remaining untouched */}
          <div
            className="h-full bg-slate-700 flex-1 rounded-r-full"
            title="Non-shareable remaining"
          ></div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800 text-center relative z-10">
        <div>
          <span className="text-[11px] text-slate-400 block">Received Data</span>
          <span className="text-sm font-bold text-emerald-400">+{receivedGB} GB</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Total Shared</span>
          <span className="text-sm font-bold text-cyan-400">{toGB(wallet.totalSharedDataMB)} GB</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Total Received</span>
          <span className="text-sm font-bold text-slate-200">{toGB(wallet.totalReceivedDataMB)} GB</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
        <button
          id="btn-quick-send-data"
          onClick={onSendClick}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-cyan-600/20"
        >
          <Send className="w-4 h-4" />
          Send Data
        </button>

        <button
          id="btn-quick-request-data"
          onClick={onRequestClick}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white active:scale-98 transition-all border border-slate-700"
        >
          <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
          Request
        </button>

        <button
          id="btn-quick-pool-donate"
          onClick={onPoolClick}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white active:scale-98 transition-all border border-slate-700/80"
        >
          <HeartHandshake className="w-4 h-4 text-indigo-400" />
          Donate Pool
        </button>
      </div>
    </div>
  );
};
