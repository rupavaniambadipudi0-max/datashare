import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Phone, Mail, Wifi, Calendar, IndianRupee, LogOut } from 'lucide-react';

interface ProfilePageProps {
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const { user, plan, wallet, coinWallet } = useAuth();
  if (!user) return null;

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Profile Overview */}
      <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-xl text-white uppercase shadow-lg shadow-cyan-600/20">
          {user.fullName ? user.fullName[0] : 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user.fullName}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {user.role}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> {user.phone}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> {user.email}
            </span>
          </div>
        </div>
      </div>

      {/* Linked Telecom Plan */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">Active Cellular Subscription</h2>
            <p className="text-xs text-slate-400">
              {plan?.operatorName || 'Telecom Carrier'} &bull; {plan?.planName || 'Unlimited Plan'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Monthly Cost</span>
            <span className="text-base font-bold text-white flex items-center">
              <IndianRupee className="w-3.5 h-3.5" />
              {plan?.price || 299}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Total Quota</span>
            <span className="text-base font-bold text-cyan-400">
              {wallet ? `${toGB(wallet.totalDataMB)} GB` : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Shareable Quota</span>
            <span className="text-base font-bold text-amber-400">
              {wallet ? `${toGB(wallet.shareableDataMB)} GB` : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Coins Balance</span>
            <span className="text-base font-bold text-emerald-400">
              {coinWallet?.coinBalance || 0}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/20 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Billing Cycle: {plan?.startDate} to {plan?.endDate}
          </span>
          <span className="text-emerald-400 font-semibold uppercase text-[10px]">
            {plan?.status || 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Security & System Info */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Platform Security</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your account is secured with JWT tokens, SQLite disk persistence with atomic write-ahead commit, and live peer-to-peer event synchronization via Server-Sent Events.
        </p>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-3.5 rounded-2xl font-bold text-xs bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 text-rose-400 flex items-center justify-center gap-2 transition-all"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
};
