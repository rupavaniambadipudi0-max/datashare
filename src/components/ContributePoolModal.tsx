import React, { useState } from 'react';
import { Heart, X, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ContributePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ContributePoolModal: React.FC<ContributePoolModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshUser } = useAuth();
  const [amountGB, setAmountGB] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const shareableMB = wallet ? wallet.shareableDataMB : 0;
  const currentAmountMB = Math.round(amountGB * 1024);
  const coinsEarnedPreview = Math.floor((currentAmountMB / 1024) * 10);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentAmountMB > shareableMB) {
      setError(`Cannot contribute ${amountGB} GB: your shareable balance is only ${(shareableMB / 1024).toFixed(1)} GB.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.contributeToPool(currentAmountMB);
      if (res.success && res.data) {
        setSuccessData(res.data);
        await refreshUser();
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Pool contribution failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Pool contribution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setError(null);
    setAmountGB(3);
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

        {successData ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-white">Contribution Successful!</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
              Your {amountGB} GB mobile data is now available in the Community Data Pool for users facing connectivity emergency.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Reward Coins Earned:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> +{successData.coinsEarned} Coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated Shareable Balance:</span>
                <span className="font-semibold text-white">
                  {(successData.wallet?.shareableDataMB / 1024).toFixed(1)} GB
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleContribute}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Donate to Community Pool</h3>
                <p className="text-xs text-slate-400">Help the community & earn instant reward coins</p>
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
                  Donation Amount
                </label>
                <span className="text-xs text-cyan-400 font-medium">
                  Shareable: {(shareableMB / 1024).toFixed(1)} GB
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => setAmountGB(gb)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      amountGB === gb
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                    }`}
                  >
                    {gb} GB
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 flex items-center justify-between text-xs text-amber-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Automatic Coin Reward:
              </span>
              <strong className="text-amber-400 font-bold text-sm">
                +{coinsEarnedPreview} Coins
              </strong>
            </div>

            <button
              type="submit"
              id="btn-confirm-pool-contribute"
              disabled={isLoading || currentAmountMB > shareableMB}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing Donation...' : `Donate ${amountGB} GB to Community Pool`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
