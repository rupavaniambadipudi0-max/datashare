import React, { useState } from 'react';
import { ArrowDownToLine, X, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DataPool } from '../types';

interface WithdrawPoolModalProps {
  isOpen: boolean;
  pool: DataPool | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawPoolModal: React.FC<WithdrawPoolModalProps> = ({ isOpen, pool, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [amountGB, setAmountGB] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const poolAvailableMB = pool ? pool.totalAvailableMB : 0;
  const currentAmountMB = Math.round(amountGB * 1024);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentAmountMB > poolAvailableMB) {
      setError(`Cannot withdraw ${amountGB} GB: pool only has ${(poolAvailableMB / 1024).toFixed(1)} GB available.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.withdrawFromPool(currentAmountMB);
      if (res.success) {
        setSuccess(true);
        await refreshUser();
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Withdrawal failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setAmountGB(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-white">Data Claimed!</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
              Successfully received {amountGB} GB from the community pool. It has been credited to your remaining data balance.
            </p>
            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Claim Emergency Data</h3>
                <p className="text-xs text-slate-400">Directly withdraw from community reserve</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Amount
                </label>
                <span className="text-xs text-indigo-300 font-medium">
                  Pool Reserve: {(poolAvailableMB / 1024).toFixed(1)} GB
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    disabled={gb * 1024 > poolAvailableMB}
                    onClick={() => setAmountGB(gb)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      amountGB === gb
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80 disabled:opacity-30 disabled:pointer-events-none'
                    }`}
                  >
                    {gb} GB
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 mb-5">
              Available pool data is community-donated. Please claim only what is necessary.
            </div>

            <button
              type="submit"
              id="btn-confirm-pool-withdraw"
              disabled={isLoading || poolAvailableMB < currentAmountMB}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing Claim...' : `Claim ${amountGB} GB from Pool`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
