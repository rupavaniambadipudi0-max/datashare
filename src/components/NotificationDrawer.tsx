import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCheck, Wifi, ArrowDownLeft, Heart, Coins, Smartphone, ShoppingBag } from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
      await refreshUser();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.isRead === 0) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: 1 } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        await refreshUser();
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    if (notif.link) {
      const tab = notif.link.replace('/', '');
      onNavigateTab(tab);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DATA_SENT':
      case 'DATA_RECEIVED':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'DATA_REQUEST':
      case 'REQUEST_ACCEPTED':
      case 'REQUEST_REJECTED':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      case 'POOL_CONTRIBUTION':
      case 'POOL_WITHDRAWAL':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'COINS_EARNED':
      case 'COINS_SPENT':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'RECHARGE_SUCCESS':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'REWARD_REDEEMED':
        return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n) => n.isRead === 0)
    : notifications;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col text-white shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-medium transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              filter === 'all'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              filter === 'unread'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet.
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  notif.isRead === 0
                    ? 'bg-slate-800/80 border-cyan-500/30 hover:bg-slate-800'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 opacity-85'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{notif.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                </div>
                {notif.isRead === 0 && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-2"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
