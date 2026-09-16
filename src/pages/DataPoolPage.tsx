import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Heart, ArrowDownToLine, Award, Clock, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';
import { DataPool, Transaction } from '../types';
import { ContributePoolModal } from '../components/ContributePoolModal';
import { WithdrawPoolModal } from '../components/WithdrawPoolModal';

export const DataPoolPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [pool, setPool] = useState<DataPool | null>(null);
  const [poolHistory, setPoolHistory] = useState<Transaction[]>([]);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchPoolData = async () => {
    try {
      const [statusRes, txRes] = await Promise.all([
        api.getPoolStatus(),
        api.getTransactions('ALL', 20)
      ]);
      if (statusRes.success && statusRes.data) {
        setPool(statusRes.data.pool);
      }
      if (txRes.success && txRes.data) {
        setPoolHistory(
          txRes.data.filter((t: Transaction) =>
            t.type === 'POOL_CONTRIBUTION' || t.type === 'POOL_WITHDRAWAL'
          )
        );
      }
    } catch (err) {
      console.error('Failed to load pool data:', err);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);

  const handleSuccess = () => {
    fetchPoolData();
    refreshUser();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Community Data Pool</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Shared Reserve
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            A collective mobile data bank powered by peer contributions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDonateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Heart className="w-4 h-4 text-rose-300" /> Donate Data
          </button>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4 text-cyan-400" /> Claim Emergency Data
          </button>
        </div>
      </div>

      {/* Pool Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Available Reserve
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-300">
              {pool ? toGB(pool.totalAvailableMB) : 0}
            </span>
            <span className="text-sm font-semibold text-indigo-400">GB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Ready for instant emergency withdrawal</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Total Donated
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400">
              {pool ? toGB(pool.totalContributedMB) : 0}
            </span>
            <span className="text-sm font-semibold text-emerald-500/80">GB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Contributed by community champions</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Total Distributed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-cyan-400">
              {pool ? toGB(pool.totalDistributedMB) : 0}
            </span>
            <span className="text-sm font-semibold text-cyan-500/80">GB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Saved users in emergency low-data situations</p>
        </div>
      </div>

      {/* Community Incentives Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Community Reward Engine</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Every 1 GB you donate to the Community Data Pool automatically generates <strong>10 reward coins</strong> in your Coin Wallet. Redeem your coins for real virtual recharges, Swiggy food vouchers, and OTT entertainment passes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDonateOpen(true)}
          className="self-start sm:self-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
        >
          Donate 1 GB for 10 Coins
        </button>
      </div>

      {/* Pool Ledger */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Your Community Pool Ledger</h3>
          </div>
        </div>

        {poolHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No pool donations or claims found in your transaction history.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {poolHistory.map((tx) => {
              const isContribution = tx.type === 'POOL_CONTRIBUTION';
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isContribution
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {isContribution ? <Heart className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {isContribution ? 'Donation to Community Pool' : 'Emergency Withdrawal from Pool'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {tx.transactionId} &bull; {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold text-sm ${
                        isContribution ? 'text-indigo-400' : 'text-cyan-400'
                      }`}
                    >
                      {isContribution ? `-${toGB(tx.amountMB)} GB` : `+${toGB(tx.amountMB)} GB`}
                    </span>
                    <span className="block text-[10px] text-emerald-400 font-medium">COMPLETED</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ContributePoolModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccess={handleSuccess}
      />
      <WithdrawPoolModal
        isOpen={isWithdrawOpen}
        pool={pool}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
