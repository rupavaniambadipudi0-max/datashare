import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Search, ArrowDownLeft, ArrowUpRight, HeartHandshake, Copy, Check } from 'lucide-react';
import { api } from '../api/client';
import { Transaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions(filterType, 100);
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);

  const filtered = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.transactionId.toLowerCase().includes(q) ||
      (tx.senderName && tx.senderName.toLowerCase().includes(q)) ||
      (tx.senderPhone && tx.senderPhone.includes(q)) ||
      (tx.receiverName && tx.receiverName.toLowerCase().includes(q)) ||
      (tx.receiverPhone && tx.receiverPhone.includes(q)) ||
      (tx.note && tx.note.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black text-white">Transaction History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit record of all peer transfers and community pool operations
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-mono">
          {transactions.length} Total Records
        </span>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'ALL', label: 'All Operations' },
            { id: 'PEER_TRANSFER', label: 'Peer Transfers' },
            { id: 'POOL_CONTRIBUTION', label: 'Pool Donations' },
            { id: 'POOL_WITHDRAWAL', label: 'Pool Claims' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === type.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TxID or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden text-white">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No transactions match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((tx) => {
              const isSender = tx.senderId === user?.id;
              const formattedGB = toGB(tx.amountMB);

              return (
                <div key={tx.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        tx.type === 'PEER_TRANSFER'
                          ? isSender
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'POOL_CONTRIBUTION'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {tx.type === 'PEER_TRANSFER' ? (
                        isSender ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <HeartHandshake className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {tx.type === 'PEER_TRANSFER'
                            ? isSender
                              ? `Sent to ${tx.receiverName || tx.receiverPhone || 'Peer'}`
                              : `Received from ${tx.senderName || tx.senderPhone || 'Peer'}`
                            : tx.type === 'POOL_CONTRIBUTION'
                            ? 'Community Pool Donation'
                            : 'Community Pool Withdrawal'}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>

                      {tx.note && (
                        <p className="text-xs text-slate-300 mt-1 italic">"{tx.note}"</p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                        <span>{tx.transactionId}</span>
                        <button
                          onClick={() => handleCopy(tx.transactionId)}
                          className="hover:text-slate-300"
                          title="Copy Transaction ID"
                        >
                          {copiedId === tx.transactionId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span>&bull;</span>
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <span
                      className={`text-base font-black ${
                        tx.type === 'PEER_TRANSFER'
                          ? isSender
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : tx.type === 'POOL_CONTRIBUTION'
                          ? 'text-indigo-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'PEER_TRANSFER'
                        ? isSender ? `-${formattedGB} GB` : `+${formattedGB} GB`
                        : tx.type === 'POOL_CONTRIBUTION'
                        ? `-${formattedGB} GB`
                        : `+${formattedGB} GB`}
                    </span>
                    <span className="block text-[11px] text-emerald-400 font-semibold mt-0.5">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
