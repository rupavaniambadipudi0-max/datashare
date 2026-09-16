import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { NotificationDrawer } from './components/NotificationDrawer';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataWalletPage } from './pages/DataWalletPage';
import { SendDataPage } from './pages/SendDataPage';
import { RequestsListPage } from './pages/RequestsListPage';
import { DataPoolPage } from './pages/DataPoolPage';
import { CoinWalletPage } from './pages/CoinWalletPage';
import { VirtualRechargePage } from './pages/VirtualRechargePage';
import { RewardsCatalogPage } from './pages/RewardsCatalogPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Connecting to DataShare...
          </span>
        </div>
      </div>
    );
  }

  // Determine active view
  const renderView = () => {
    if (!user) {
      if (currentTab === 'register') {
        return (
          <RegisterPage
            onSuccess={() => setCurrentTab('dashboard')}
            onGoToLogin={() => setCurrentTab('login')}
          />
        );
      }
      if (currentTab === 'login') {
        return (
          <LoginPage
            onSuccess={() => setCurrentTab('dashboard')}
            onGoToRegister={() => setCurrentTab('register')}
          />
        );
      }
      return (
        <HomePage
          onGoToLogin={() => setCurrentTab('login')}
          onGoToRegister={() => setCurrentTab('register')}
        />
      );
    }

    switch (currentTab) {
      case 'data-wallet':
        return <DataWalletPage />;
      case 'share-data':
        return (
          <SendDataPage
            onBack={() => setCurrentTab('dashboard')}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );
      case 'my-requests':
        return <RequestsListPage />;
      case 'data-pool':
        return <DataPoolPage />;
      case 'coin-wallet':
        return <CoinWalletPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'recharge':
        return <VirtualRechargePage />;
      case 'rewards':
        return <RewardsCatalogPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'profile':
        return (
          <ProfilePage
            onLogout={() => {
              logout();
              setCurrentTab('home');
            }}
          />
        );
      case 'admin':
        return <AdminPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {renderView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Notifications Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-bold text-slate-400">DataShare Platform</span> &bull; Peer Mobile Data Sharing & Rewards
            <p className="text-[11px] text-slate-600 mt-0.5">
              Simulated virtual telecom backend with persistent SQLite storage & SSE live sync
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setCurrentTab(user ? 'dashboard' : 'home')}
              className="hover:text-slate-300 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('data-pool')}
              className="hover:text-slate-300 transition-colors"
            >
              Community Pool
            </button>
            <button
              onClick={() => setCurrentTab('rewards')}
              className="hover:text-slate-300 transition-colors"
            >
              Rewards
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className="text-rose-400 hover:text-rose-300 font-semibold"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppContent />
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
