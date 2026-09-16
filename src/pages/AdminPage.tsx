import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Activity, Settings, AlertTriangle, Save, CheckCircle, Smartphone, ShoppingBag } from 'lucide-react';
import { api } from '../api/client';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'users' | 'settings' | 'fraud'>('metrics');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, uRes, sRes, fRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminSettings(),
        api.getAdminFraudAlerts()
      ]);
      if (mRes.success && mRes.data) setMetrics(mRes.data);
      if (uRes.success && uRes.data) setUsersList(uRes.data);
      if (sRes.success && sRes.data) setSettings(sRes.data);
      if (fRes.success && fRes.data) setFraudAlerts(fRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAdminData();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-rose-400">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400 mt-1">
          This section is restricted to administrative personnel. Switch to the Admin test user from the menu.
        </p>
      </div>
    );
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.toggleUserStatus(userId, newStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = async (key: string) => {
    try {
      await api.updateAdminSetting(key, settings[key]);
      setSaveMessage(`Setting "${key}" saved successfully!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save setting: ${err.message}`);
    }
  };

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Admin Control Console</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, fraud risk monitoring, user management, and platform parameters
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'metrics', label: 'Telemetry', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'fraud', label: 'Fraud Alerts', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* METRICS VIEW */}
      {activeSubTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white">
              <span className="text-[11px] text-slate-400 block mb-1">Total Registered Users</span>
              <span className="text-3xl font-black text-cyan-400">{metrics.totalUsers}</span>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white">
              <span className="text-[11px] text-slate-400 block mb-1">Total P2P Data Transferred</span>
              <span className="text-3xl font-black text-emerald-400">
                {toGB(metrics.totalDataSharedMB)} GB
              </span>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white">
              <span className="text-[11px] text-slate-400 block mb-1">Community Pool Reserve</span>
              <span className="text-3xl font-black text-indigo-300">
                {toGB(metrics.poolAvailableMB)} GB
              </span>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white">
              <span className="text-[11px] text-slate-400 block mb-1">Circulating Coins</span>
              <span className="text-3xl font-black text-amber-400">{metrics.totalCoinsInCirculation}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total Transactions</span>
                <span className="text-2xl font-black text-white">{metrics.totalTransactions}</span>
              </div>
              <Activity className="w-8 h-8 text-cyan-500/40" />
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Virtual Recharges</span>
                <span className="text-2xl font-black text-white">{metrics.totalRecharges}</span>
              </div>
              <Smartphone className="w-8 h-8 text-amber-500/40" />
            </div>
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Vouchers Claimed</span>
                <span className="text-2xl font-black text-white">{metrics.totalRedemptions}</span>
              </div>
              <ShoppingBag className="w-8 h-8 text-purple-500/40" />
            </div>
          </div>
        </div>
      )}

      {/* USERS VIEW */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden text-white">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Platform User Directory</h3>
            <span className="text-xs text-slate-400">{usersList.length} accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Mobile & Role</th>
                  <th className="px-5 py-3 font-semibold">Remaining Data</th>
                  <th className="px-5 py-3 font-semibold">Shareable</th>
                  <th className="px-5 py-3 font-semibold">Coins</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-semibold text-white">
                      {u.fullName}
                      <span className="block text-[11px] text-slate-400 font-normal font-mono">{u.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-slate-200">{u.phone}</span>
                      <span className="block text-[10px] font-bold text-cyan-400">{u.role}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-200">
                      {u.remainingDataMB ? `${toGB(u.remainingDataMB)} GB` : '--'}
                    </td>
                    <td className="px-5 py-4 font-bold text-cyan-400">
                      {u.shareableDataMB ? `${toGB(u.shareableDataMB)} GB` : '--'}
                    </td>
                    <td className="px-5 py-4 font-bold text-amber-400">
                      {u.coinBalance ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-950/70 border border-rose-800/50'
                              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-800/50'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6">
          <div>
            <h3 className="font-bold text-base text-white">System Config Parameters</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune reward multipliers, fraud limits, and emergency pool quotas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(settings).map((key) => (
              <div key={key} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={settings[key]}
                    onChange={(e) => handleSettingChange(key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={() => handleSaveSetting(key)}
                  className="px-3.5 py-2 mt-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FRAUD ALERTS VIEW */}
      {activeSubTab === 'fraud' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Fraud Risk & Anomaly Detection</h3>
          </div>

          {fraudAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
              All clean. Zero anomalous transfer velocity alerts detected.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-amber-400 block">{alert.reason}</span>
                    <span className="text-[11px] text-slate-400">
                      User: {alert.fullName} ({alert.phone}) &bull; Severity: <strong className="text-rose-400">{alert.severity}</strong>
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
