import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, Activity, ShieldCheck, PlayCircle, Zap, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export const DataWalletPage: React.FC = () => {
  const { wallet, plan, refreshUser } = useAuth();
  const [simulateAmount, setSimulateAmount] = useState<number>(512); // 512 MB
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  if (!wallet) return null;

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 2);

  const handleSimulateUsage = async () => {
    setIsSimulating(true);
    setSimulationMessage(null);
    try {
      const res = await api.simulateUsage(simulateAmount);
      if (res.success) {
        setSimulationMessage(`Simulated consuming ${(simulateAmount / 1024).toFixed(1)} GB. Balances updated!`);
        await refreshUser();
      }
    } catch (err: any) {
      setSimulationMessage(`Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const percentUsed = Math.min(100, Math.round((wallet.usedDataMB / wallet.totalDataMB) * 100));
  const percentShareable = Math.min(100, Math.round((wallet.shareableDataMB / wallet.totalDataMB) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Mobile Data Wallet</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authoritative DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time balance breakdown synchronized with virtual telecom core
          </p>
        </div>

        <button
          onClick={refreshUser}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Balances
        </button>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Data */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Plan Total Quota
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{toGB(wallet.totalDataMB)}</span>
            <span className="text-sm font-semibold text-slate-400">GB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active package allocation</p>
        </div>

        {/* Remaining Data */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Remaining Usable
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{toGB(wallet.remainingDataMB)}</span>
            <span className="text-sm font-semibold text-slate-400">GB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {toGB(wallet.usedDataMB)} GB consumed so far ({percentUsed}%)
          </p>
        </div>

        {/* Shareable Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 text-white relative">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Shareable Data
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300">{toGB(wallet.shareableDataMB)}</span>
            <span className="text-sm font-semibold text-cyan-400">GB</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Eligible for peer transfers and pool donations
          </p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white">Data Allocation Breakdown</h3>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-700">
          <div
            style={{ width: `${percentUsed}%` }}
            className="h-full bg-slate-500 rounded-l-full"
            title={`Used: ${toGB(wallet.usedDataMB)} GB`}
          ></div>
          <div
            style={{ width: `${percentShareable}%` }}
            className="h-full bg-cyan-400"
            title={`Shareable: ${toGB(wallet.shareableDataMB)} GB`}
          ></div>
          <div className="h-full bg-slate-700 flex-1 rounded-r-full" title="Remaining untouched"></div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span>
            <span>Used: <strong className="text-white">{toGB(wallet.usedDataMB)} GB</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <span>Shareable: <strong className="text-white">{toGB(wallet.shareableDataMB)} GB</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-700"></span>
            <span>Personal Non-Shareable Remaining: <strong className="text-white">{toGB(wallet.remainingDataMB - wallet.shareableDataMB)} GB</strong></span>
          </div>
        </div>
      </div>

      {/* Plan Details & Simulator Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Cellular Plan */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Active Telecom Plan</h3>
              <p className="text-xs text-slate-400">{plan?.planName || 'Unlimited Plan'}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Operator:</span>
              <span className="font-bold text-cyan-400">{plan?.operatorName || 'Carrier'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Cost:</span>
              <span className="font-semibold text-white">₹{plan?.price || 299}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Plan Start Date:</span>
              <span className="font-mono text-slate-300">{plan?.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Plan Expiry Date:</span>
              <span className="font-mono text-slate-300">{plan?.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-bold uppercase">{plan?.status}</span>
            </div>
          </div>
        </div>

        {/* Live Cellular Usage Simulator */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Live Data Consumption Simulator</h3>
              <p className="text-xs text-slate-400">Test how carrier consumption reduces shareable data</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Simulate watching high-definition videos or streaming music. If your remaining data falls below the shareable limit, the system automatically recalibrates your shareable quota.
          </p>

          <div className="flex items-center gap-2">
            {[256, 512, 1024, 2048].map((mb) => (
              <button
                key={mb}
                type="button"
                onClick={() => setSimulateAmount(mb)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold ${
                  simulateAmount === mb
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
              </button>
            ))}
          </div>

          {simulationMessage && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              {simulationMessage}
            </div>
          )}

          <button
            onClick={handleSimulateUsage}
            disabled={isSimulating}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            {isSimulating ? 'Simulating Traffic...' : `Consume ${(simulateAmount / 1024).toFixed(1)} GB Now`}
          </button>
        </div>
      </div>
    </div>
  );
};
