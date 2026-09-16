import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Check, X, Clock, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { DataRequest } from '../types';
import { RequestDataModal } from '../components/RequestDataModal';

export const RequestsListPage: React.FC = () => {
  const { wallet, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<DataRequest[]>([]);
  const [outgoing, setOutgoing] = useState<DataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        api.getIncomingRequests(),
        api.getOutgoingRequests()
      ]);
      if (inRes.success && inRes.data) setIncoming(inRes.data);
      if (outRes.success && outRes.data) setOutgoing(outRes.data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.acceptRequest(id);
      if (res.success) {
        setActionSuccess('Data request accepted and data transferred successfully!');
        await fetchRequests();
        await refreshUser();
      } else {
        setActionError(res.message || 'Failed to accept request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept request.');
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.rejectRequest(id);
      if (res.success) {
        setActionSuccess('Data request rejected.');
        await fetchRequests();
      } else {
        setActionError(res.message || 'Failed to reject request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject request.');
    }
  };

  const handleCancel = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.cancelRequest(id);
      if (res.success) {
        setActionSuccess('Request cancelled.');
        await fetchRequests();
      } else {
        setActionError(res.message || 'Failed to cancel request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel request.');
    }
  };

  const toGB = (mb: number) => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black text-white">Data Requests</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage incoming peer data requests and track outgoing asks
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
        >
          <ArrowDownLeft className="w-4 h-4" /> Request Data from Friend
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'incoming'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Incoming Requests ({incoming.filter((r) => r.status === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'outgoing'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Outgoing Requests ({outgoing.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'incoming' ? (
          incoming.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
              <Download className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No incoming data requests at this moment.
            </div>
          ) : (
            incoming.map((req) => {
              const isPending = req.status === 'PENDING';
              const canFulfill = wallet && wallet.shareableDataMB >= req.amountMB;

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {req.requesterName || req.requesterPhone}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        {toGB(req.amountMB)} GB
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : req.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {req.note && (
                      <p className="text-xs text-slate-300 mt-1 italic">
                        "{req.note}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={!canFulfill}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-cyan-500/20"
                      >
                        {canFulfill ? `Accept & Send ${toGB(req.amountMB)} GB` : 'Insufficient Shareable Data'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : outgoing.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
            <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 opacity-30" />
            You haven't requested data from anyone yet.
          </div>
        ) : (
          outgoing.map((req) => {
            const isPending = req.status === 'PENDING';

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Asked:</span>
                    <span className="font-bold text-sm text-white">
                      {req.targetName || req.targetPhone}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      {toGB(req.amountMB)} GB
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : req.status === 'CANCELLED'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.note && (
                    <p className="text-xs text-slate-300 mt-1 italic">"{req.note}"</p>
                  )}

                  <div className="text-[11px] text-slate-500 mt-1">
                    Requested on: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <RequestDataModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
};
