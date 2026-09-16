import React, { useState } from 'react';
import {
  Wifi,
  Coins,
  Bell,
  User as UserIcon,
  Shield,
  LogOut,
  Repeat,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenNotifications }) => {
  const { user, wallet, coinWallet, unreadCount, logout, quickLogin } = useAuth();
  const { isConnected } = useRealtime();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const formatMBtoGB = (mb: number) => {
    return (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* Disclaimer Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 text-cyan-200 text-xs py-1 px-4 text-center border-b border-cyan-900/40 font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Virtual Mobile Data Sharing Prototype &bull; Real cellular balances are not modified</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
            id="brand-logo-btn"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                DataShare
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-1.5 py-0.5 rounded border border-cyan-500/30">
                  LIVE
                </span>
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1">P2P Virtual Data & Rewards</span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'data-wallet', label: 'Wallet' },
                { id: 'share-data', label: 'Send' },
                { id: 'my-requests', label: 'Requests' },
                { id: 'data-pool', label: 'Community Pool' },
                { id: 'recharge', label: 'Recharge' },
                { id: 'rewards', label: 'Rewards' },
                { id: 'transactions', label: 'History' },
              ].map((link) => (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => setCurrentTab(link.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentTab === link.id
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {user.role === 'ADMIN' && (
                <button
                  id="nav-link-admin"
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-rose-400 hover:bg-rose-950/30'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
            </nav>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Balances Quick View */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 px-2.5">
                {/* Shareable Data Pill */}
                <button
                  onClick={() => setCurrentTab('share-data')}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 pr-2 border-r border-slate-700"
                  title="Your shareable balance"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="font-semibold text-white">
                    {wallet ? `${formatMBtoGB(wallet.shareableDataMB)} GB` : '--'}
                  </span>
                  <span className="text-[11px] text-slate-400">Shareable</span>
                </button>

                {/* Coins Pill */}
                <button
                  onClick={() => setCurrentTab('coin-wallet')}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 pl-1"
                  title="Your reward coins"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-300">
                    {coinWallet ? coinWallet.coinBalance : 0}
                  </span>
                  <span className="text-[11px] text-slate-400">Coins</span>
                </button>
              </div>

              {/* Real-time indicator dot */}
              <div
                className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 px-2 py-1 rounded-md bg-slate-800/50"
                title={isConnected ? 'Real-time WebSocket/SSE connected' : 'Connecting to real-time events...'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-ping'
                  }`}
                ></span>
                <span className="text-[10px] uppercase font-semibold tracking-wider">
                  {isConnected ? 'Realtime' : 'Syncing'}
                </span>
              </div>

              {/* Notifications Bell */}
              <button
                id="btn-notifications-bell"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                title="View Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="btn-user-avatar"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                    {user.fullName ? user.fullName[0] : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-white leading-none">
                      {user.fullName.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">
                      {user.phone}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 text-slate-200 animate-in fade-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-slate-800">
                      <div className="font-semibold text-white text-sm">{user.fullName}</div>
                      <div className="text-xs text-slate-400">{user.phone}</div>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5">{user.email}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Role:</span>
                        <span className="font-bold uppercase text-indigo-300">{user.role}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-300"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Telecom Plan
                      </button>

                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setCurrentTab('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 text-rose-400"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </button>
                      )}
                    </div>

                    {/* Quick switch users for testing */}
                    <div className="px-4 py-2 bg-slate-950/60 border-t border-b border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1.5">
                        <Repeat className="w-3 h-3" /> Quick Switch Test User
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => {
                            quickLogin('9876543210');
                            setShowUserMenu(false);
                          }}
                          className={`text-[11px] py-1 px-1.5 rounded font-medium text-center transition-colors ${
                            user.phone === '9876543210'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Arjun
                        </button>
                        <button
                          onClick={() => {
                            quickLogin('9876543211');
                            setShowUserMenu(false);
                          }}
                          className={`text-[11px] py-1 px-1.5 rounded font-medium text-center transition-colors ${
                            user.phone === '9876543211'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Priya
                        </button>
                        <button
                          onClick={() => {
                            quickLogin('9999999999');
                            setShowUserMenu(false);
                          }}
                          className={`text-[11px] py-1 px-1.5 rounded font-medium text-center transition-colors ${
                            user.phone === '9999999999'
                              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Admin
                        </button>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentTab('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:brightness-110 shadow-md shadow-cyan-500/20 transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
