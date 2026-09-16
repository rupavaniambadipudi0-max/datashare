import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Coins, ShieldCheck, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';

interface SendDataPageProps {
  onBack: () => void;
  onNavigateTab: (tab: string) => void;
}

export const SendDataPage: React.FC<SendDataPageProps> = ({ onBack, onNavigateTab }) => {
  const { wallet, refreshUser } = useAuth();
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amountGB, setAmountGB] = useState<number>(2);
  const [customMB, setCustomMB] = useState<string>('');
  const [useCustomMB, setUseCustomMB] = useState<boolean>(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const shareableMB = wallet ? wallet.shareableDataMB : 0;
  const currentAmountMB = useCustomMB ? (parseInt(customMB, 10) || 0) : Math.round(amountGB * 1024);
  const coinsEarnedPreview = Math.floor((currentAmountMB / 1024) * 10);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = receiverPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (currentAmountMB <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }

    if (currentAmountMB > shareableMB) {
      setError(`Amount exceeds your shareable balance of ${(shareableMB / 1024).toFixed(2)} GB.`);
      return;
    }

    setIsLoading(true);
    const idempotencyKey = `idemp_page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await api.sendData({
        receiverPhone: cleanPhone,
        amountMB: currentAmountMB,
        message: message.trim() || undefined,
        idempotencyKey
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        await refreshUser();
      } else {
        setError(res.message || 'Transfer failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setError(null);
    setReceiverPhone('');
    setAmountGB(2);
    setCustomMB('');
    setUseCustomMB(false);
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <button
        onClick={onBack}
        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        {successData ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-white">Transfer Successful!</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              TxID: {successData.transactionId}
            </p>

            <div className="my-6 p-5 rounded-2xl bg-slate-800/60 border border-slate-800 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-semibold text-white">
                  {successData.receiver?.fullName} ({successData.receiver?.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Volume Transferred:</span>
                <span className="font-bold text-cyan-400">
                  {(successData.amountMB / 1024).toFixed(1)} GB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coins Credited:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> +{successData.coinsEarned} Coins
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Your Remaining Shareable:</span>
                <span className="font-semibold text-white">
                  {(successData.senderWallet?.shareableDataMB / 1024).toFixed(1)} GB
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Send Another
              </button>
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Send Mobile Data</h2>
                <p className="text-xs text-slate-400">Instant peer-to-peer data transfer with reward coins</p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recipient Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs text-slate-400 font-medium">+91</span>
                <input
                  type="tel"
                  id="send-input-phone"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500 font-mono"
                  required
                />
              </div>

              {/* Suggested Demo Contacts */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Quick select demo user:</span>
                <button
                  type="button"
                  onClick={() => setReceiverPhone('9876543211')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 border border-slate-700"
                >
                  Priya (9876543211)
                </button>
                <button
                  type="button"
                  onClick={() => setReceiverPhone('9876543210')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 border border-slate-700"
                >
                  Arjun (9876543210)
                </button>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transfer Data Volume
                </label>
                <span className="text-xs text-cyan-400 font-medium">
                  Shareable Quota: {(shareableMB / 1024).toFixed(1)} GB
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 5].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => {
                      setAmountGB(gb);
                      setUseCustomMB(false);
                    }}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      !useCustomMB && amountGB === gb
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {gb} GB
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setUseCustomMB(!useCustomMB)}
                  className="text-xs text-slate-400 hover:text-cyan-400"
                >
                  {useCustomMB ? '← Back to standard presets' : '+ Enter custom megabytes (MB)'}
                </button>
                {useCustomMB && (
                  <input
                    type="number"
                    value={customMB}
                    onChange={(e) => setCustomMB(e.target.value)}
                    placeholder="Enter custom MB (e.g. 500, 1500)"
                    className="mt-2 w-full px-4 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Transfer Note (Optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. For research project"
                className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            {/* Reward Preview */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300 font-medium">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-bold text-amber-300 text-sm">+{coinsEarnedPreview} Coins Reward</div>
                  <div className="text-[11px] text-amber-400/80">Credited directly to your coin wallet upon delivery</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-400/20 px-2 py-1 rounded border border-amber-400/30">
                10 Coins / GB
              </span>
            </div>

            <button
              type="submit"
              id="submit-send-data-btn"
              disabled={isLoading || currentAmountMB > shareableMB}
              className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Processing Safe Transfer...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirm & Send {(currentAmountMB / 1024).toFixed(1)} GB Data
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Secured with atomic database rollback & fraud rate limits
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
