import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { TOKEN_KEY } from '../api/client';

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: { event: string; data: any } | null;
  toast: { title: string; message: string; type?: string } | null;
  dismissToast: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; type?: string } | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`/api/realtime?token=${encodeURIComponent(token)}`);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        const handleIncomingEvent = (eventName: string, e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            setLastEvent({ event: eventName, data: parsed.data });

            // Always refresh authoritative user balances from DB
            refreshUser();

            // Display contextual in-app toast for incoming actions
            if (eventName === 'DATA_RECEIVED') {
              setToast({
                title: 'Data Received! 📶',
                message: `${parsed.data.from} sent you ${(parsed.data.amountMB / 1024).toFixed(1)} GB mobile data.`,
                type: 'success'
              });
            } else if (eventName === 'REQUEST_CREATED') {
              setToast({
                title: 'New Data Request 📥',
                message: `${parsed.data.requester} requested ${(parsed.data.amountMB / 1024).toFixed(1)} GB from you.`,
                type: 'info'
              });
            } else if (eventName === 'REQUEST_ACCEPTED') {
              setToast({
                title: 'Request Accepted! 🎉',
                message: `${parsed.data.acceptedBy} approved your request for ${(parsed.data.amountMB / 1024).toFixed(1)} GB data.`,
                type: 'success'
              });
            } else if (eventName === 'COINS_EARNED') {
              setToast({
                title: 'Coins Earned! 🪙',
                message: `+${parsed.data.earned} reward coins credited to your wallet.`,
                type: 'success'
              });
            }
          } catch (err) {
            console.error('Error handling SSE event:', err);
          }
        };

        const events = [
          'WALLET_UPDATED',
          'DATA_SENT',
          'DATA_RECEIVED',
          'REQUEST_CREATED',
          'REQUEST_ACCEPTED',
          'REQUEST_REJECTED',
          'POOL_UPDATED',
          'COINS_EARNED',
          'COINS_SPENT',
          'RECHARGE_SUCCESS',
          'REWARD_REDEEMED',
          'NOTIFICATION_CREATED'
        ];

        events.forEach((evt) => {
          eventSource?.addEventListener(evt, (e) => handleIncomingEvent(evt, e as MessageEvent));
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Auto reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, refreshUser]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, toast, dismissToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start justify-between gap-3 animate-slide-in">
          <div>
            <div className="font-semibold text-sm text-cyan-400">{toast.title}</div>
            <div className="text-xs text-slate-300 mt-0.5">{toast.message}</div>
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
