import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, ArrowLeft, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';

interface RegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onGoToLogin }) => {
  const { login } = useAuth();
  const [operators, setOperators] = useState<any[]>([]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [operatorId, setOperatorId] = useState('op_airtel');
  const [planName, setPlanName] = useState('Truly Unlimited 28GB');
  const [price, setPrice] = useState(299);
  const [totalDataGB, setTotalDataGB] = useState(28);
  const [usedDataGB, setUsedDataGB] = useState(8);
  const [shareableDataGB, setShareableDataGB] = useState(10);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOperators().then((res) => {
      if (res.success && res.data) {
        setOperators(res.data);
        if (res.data.length > 0) setOperatorId(res.data[0].id);
      }
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (shareableDataGB > totalDataGB - usedDataGB) {
      setError('Shareable data cannot exceed remaining data (Total minus Used).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim() || `${cleanPhone}@datashare.local`,
        operatorId,
        planName,
        price,
        totalDataMB: totalDataGB * 1024,
        usedDataMB: usedDataGB * 1024,
        shareableDataMB: shareableDataGB * 1024
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        onSuccess();
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        onClick={onGoToLogin}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-6 transition-colors font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-9 text-white shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wifi className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create DataShare Account</h1>
          </div>
          <p className="text-xs text-slate-400">
            Link your cellular subscription to unlock peer data sharing and earn coins
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* User Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              1. Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-medium">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 00000"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Telecom Plan Details */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              2. Telecom Subscription Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Mobile Operator
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperatorId(op.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      operatorId === op.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Plan Cost (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Quota sliders / inputs */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Total Quota (GB)
                </label>
                <input
                  type="number"
                  value={totalDataGB}
                  onChange={(e) => setTotalDataGB(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-bold"
                  min={1}
                  required
                />
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Already Used (GB)
                </label>
                <input
                  type="number"
                  value={usedDataGB}
                  onChange={(e) => setUsedDataGB(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-bold"
                  min={0}
                  required
                />
              </div>

              <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl">
                <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                  Shareable (GB)
                </label>
                <input
                  type="number"
                  value={shareableDataGB}
                  onChange={(e) => setShareableDataGB(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-300 text-sm font-bold"
                  min={1}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Setting up Data Wallet...' : (
              <>
                <UserPlus className="w-5 h-5" /> Complete Registration & Activate Wallet
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
