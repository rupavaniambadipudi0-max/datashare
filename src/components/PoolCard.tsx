import React from 'react';
import { Users, Heart, ArrowDownToLine, Globe, Award } from 'lucide-react';
import { DataPool } from '../types';

interface PoolCardProps {
  pool: DataPool | null;
  onDonateClick: () => void;
  onWithdrawClick: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({ pool, onDonateClick, onWithdrawClick }) => {
  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);
  const availableGB = pool ? toGB(pool.totalAvailableMB) : '0';
  const contributedGB = pool ? toGB(pool.totalContributedMB) : '0';
  const distributedGB = pool ? toGB(pool.totalDistributedMB) : '0';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/90 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Community Data Pool</h3>
            <p className="text-xs text-slate-400">Global shared data emergency reserve</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> Shared Reserve
        </span>
      </div>

      <div className="my-5 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Available In Pool
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-indigo-300">{availableGB}</span>
            <span className="text-sm font-bold text-indigo-400">GB</span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 space-y-1">
          <div>
            Total Donated: <strong className="text-slate-200">{contributedGB} GB</strong>
          </div>
          <div>
            Claimed / Distributed: <strong className="text-slate-200">{distributedGB} GB</strong>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200/90 flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>Donating 1 GB awards 10 reward coins immediately.</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          id="btn-pool-donate-modal"
          onClick={onDonateClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:brightness-110 active:scale-98 transition-all shadow-md shadow-indigo-600/20"
        >
          <Heart className="w-4 h-4 text-rose-300" />
          Donate to Pool
        </button>

        <button
          id="btn-pool-withdraw-modal"
          onClick={onWithdrawClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white active:scale-98 transition-all"
        >
          <ArrowDownToLine className="w-4 h-4 text-indigo-300" />
          Claim Emergency Data
        </button>
      </div>
    </div>
  );
};
