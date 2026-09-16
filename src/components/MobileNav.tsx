import React from 'react';
import { Home, Send, Download, Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'share-data', label: 'Send', icon: Send },
    { id: 'my-requests', label: 'Request', icon: Download },
    { id: 'data-pool', label: 'Pool', icon: Users },
    { id: 'data-wallet', label: 'Wallet', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
