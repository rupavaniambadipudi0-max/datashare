import React, { useState } from 'react';
import { ArrowDownLeft, X, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

interface RequestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RequestDataModal: React.FC<RequestDataModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [targetPhone, setTargetPhone] = useState('');
  const [amountGB, setAmountGB] = useState<number>(2);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = targetPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createRequest({
        targetPhone: cleanPhone,
        amountMB: Math.round(amountGB * 1024),
        note: note.trim() || undefined
      });

      if (res.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Failed to submit data request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit data request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setTargetPhone('');
    setAmountGB(2);
    setNote('');
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
            <h3 className="text-xl font-bold text-white">Data Request Sent!</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
              We notified the recipient. Once they accept, {amountGB} GB data will be credited directly to your wallet.
            </p>
            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequest}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Request Mobile Data</h3>
                <p className="text-xs text-slate-400">Ask a friend or contact for data</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                From Contact (Mobile Number)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-slate-400 font-medium">+91</span>
                <input
                  type="tel"
                  id="input-request-target-phone"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="98765 43210 (e.g. Arjun)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-slate-400">Quick contact:</span>
                <button
                  type="button"
                  onClick={() => setTargetPhone('9876543210')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Arjun (9876543210)
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Requested Volume
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => setAmountGB(gb)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      amountGB === gb
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                    }`}
                  >
                    {gb} GB
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reason / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Out of data while commuting, please send 2 GB!"
                className="w-full px-3.5 py-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-request-data"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Submitting Request...' : `Send Request for ${amountGB} GB`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
