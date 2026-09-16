import React, { useState } from 'react';
import { Send, X, AlertCircle, Coins, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SendDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendDataModal: React.FC<SendDataModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshUser } = useAuth();
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amountGB, setAmountGB] = useState<number>(2);
  const [customMB, setCustomMB] = useState<string>('');
  const [useCustomMB, setUseCustomMB] = useState<boolean>(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

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
    // Generate unique idempotency key for this transfer attempt
    const idempotencyKey = `idemp_send_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
        if (onSuccess) onSuccess();
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
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-white">Transfer Completed!</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              TxID: {successData.transactionId}
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-semibold text-white">
                  {successData.receiver?.fullName} ({successData.receiver?.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transferred Data:</span>
                <span className="font-bold text-cyan-400">
                  {(successData.amountMB / 1024).toFixed(1)} GB ({successData.amountMB} MB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reward Coins Earned:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> +{successData.coinsEarned} Coins
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Your Remaining Shareable:</span>
                <span className="font-semibold text-white">
                  {(successData.senderWallet?.shareableDataMB / 1024).toFixed(1)} GB
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Send Mobile Data</h3>
                <p className="text-xs text-slate-400">Peer-to-peer instant virtual transfer</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Phone */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-medium">+91</span>
                <input
                  type="tel"
                  id="input-receiver-phone"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="98765 43211 (e.g. Priya)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-slate-400">Demo test contact:</span>
                <button
                  type="button"
                  onClick={() => setReceiverPhone('9876543211')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Priya (9876543211)
                </button>
              </div>
            </div>

            {/* Data Amount Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transfer Amount
                </label>
                <span className="text-xs text-cyan-400 font-medium">
                  Shareable: {(shareableMB / 1024).toFixed(1)} GB
                </span>
              </div>

              {/* Quick Pills */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1, 2, 3, 5].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => {
                      setAmountGB(gb);
                      setUseCustomMB(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      !useCustomMB && amountGB === gb
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                    }`}
                  >
                    {gb} GB
                  </button>
                ))}
              </div>

              {/* Custom MB Toggle */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setUseCustomMB(!useCustomMB)}
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 mb-1.5"
                >
                  {useCustomMB ? 'Use standard GB pills' : 'Need custom MB amount?'}
                </button>
                {useCustomMB && (
                  <input
                    type="number"
                    value={customMB}
                    onChange={(e) => setCustomMB(e.target.value)}
                    placeholder="Enter custom MB (e.g. 500, 1500)"
                    className="w-full px-3.5 py-2 bg-slate-800/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                  />
                )}
              </div>
            </div>

            {/* Note / Message */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Optional Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Enjoy the streaming data!"
                className="w-full px-3.5 py-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            {/* Coins Earned Banner */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 flex items-center justify-between text-xs text-amber-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Automatic Reward:
              </span>
              <strong className="text-amber-400 font-bold text-sm">
                +{coinsEarnedPreview} Coins
              </strong>
            </div>

            <button
              type="submit"
              id="btn-confirm-send-data"
              disabled={isLoading || currentAmountMB > shareableMB}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Processing Safe Transfer...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirm & Transfer {(currentAmountMB / 1024).toFixed(1)} GB
                </>
              )}
            </button>

            <div className="mt-3 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Protected by atomic database transaction & idempotency lock
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
