import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, Send, Users, Coins, ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGoToLogin, onGoToRegister }) => {
  const { quickLogin } = useAuth();

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="max-w-2xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Next-Generation Cellular Data Marketplace
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Share Unused Mobile Data. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              Earn Instant Rewards.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Never let your monthly cellular gigabytes expire in vain. Transfer data directly to friends, donate to the community reserve pool, and earn coins for mobile recharges and shopping vouchers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToRegister}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToLogin}
              className="px-6 py-3.5 rounded-2xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              Sign In with Mobile OTP
            </button>
          </div>

          {/* One-click demo launcher */}
          <div className="pt-6 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-2 font-medium">
              Or test immediately with pre-loaded demo accounts:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => quickLogin('9876543210')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors"
              >
                Arjun (Airtel &bull; 20 GB)
              </button>
              <button
                onClick={() => quickLogin('9876543211')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors"
              >
                Priya (Jio &bull; 5 GB)
              </button>
              <button
                onClick={() => quickLogin('9999999999')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-xs font-semibold text-rose-300 border border-rose-800/40 transition-colors"
              >
                Admin (Console)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Peer-to-Peer Data Transfer</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Send shareable mobile data directly to any 10-digit number. Transfers are executed atomically in real-time with idempotency lock.
          </p>
        </div>

        <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Community Data Pool</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Donate spare gigabytes to a collective emergency pool. When community members run out of data in transit, they can claim emergency allocations.
          </p>
        </div>

        <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Guaranteed Coin Rewards</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every 1 GB shared earns 10 reward coins immediately. Use coins for virtual cellular top-ups, Swiggy food vouchers, and OTT subscriptions.
          </p>
        </div>
      </div>

      {/* Trust & Architecture */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            Carrier Simulation Prototype Architecture
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Built with persistent SQLite database engine with atomic commit rollback, Server-Sent Events (SSE) for live peer push alerts, and simulated carrier APIs for Airtel, Jio, Vi, and BSNL.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time SSE Sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Atomic DB
          </span>
        </div>
      </div>
    </div>
  );
};
