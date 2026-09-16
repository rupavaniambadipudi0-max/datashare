import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, Phone, Lock, Sparkles, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../api/client';

interface LoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onGoToRegister }) => {
  const { login, quickLogin } = useAuth();
  const [phone, setPhone] = useState('9876543210');
  const [code, setCode] = useState('123456');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.sendOtp(cleanPhone);
      if (res.success) {
        setStep('otp');
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.verifyOtp(phone.trim().replace(/[^0-9]/g, ''), code.trim());
      if (res.success && res.data) {
        if (res.data.isNewUser) {
          onGoToRegister();
        } else {
          login(res.data.token, res.data.user);
          onSuccess();
        }
      } else {
        setError(res.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-cyan-500/20">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sign In to DataShare</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your virtual data wallet, peer transfers, and coin rewards
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Preset Buttons */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            One-Click Demo Test Profiles
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                quickLogin('9876543210');
                onSuccess();
              }}
              className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <div className="text-xs font-bold text-white">Arjun</div>
              <div className="text-[10px] text-cyan-400">20 GB Active</div>
            </button>

            <button
              type="button"
              onClick={() => {
                quickLogin('9876543211');
                onSuccess();
              }}
              className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <div className="text-xs font-bold text-white">Priya</div>
              <div className="text-[10px] text-cyan-400">5 GB Active</div>
            </button>

            <button
              type="button"
              onClick={() => {
                quickLogin('9999999999');
                onSuccess();
              }}
              className="py-2 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-left border border-rose-800/40 transition-colors"
            >
              <div className="text-xs font-bold text-rose-300">Admin</div>
              <div className="text-[10px] text-slate-400">Full Console</div>
            </button>
          </div>
        </div>

        {/* Step 1: Phone */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs text-slate-400 font-medium">+91</span>
                <input
                  type="tel"
                  id="login-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending OTP...' : (
                <>
                  Continue with OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Verification Code (OTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Change phone
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  id="login-otp-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code (e.g. 123456)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500 font-mono tracking-widest text-center"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Demo code is pre-filled as <strong className="text-cyan-300 font-mono">123456</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying...' : (
                <>
                  <UserCheck className="w-4 h-4" /> Verify & Access Wallet
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-cyan-400 font-bold hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
