import React, { useState, useEffect } from 'react';
import { Menu, Play, Sparkles, Database, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { db, MongoStatus } from '../services/db';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobileNav: () => void;
  onStartSessionCTA: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  onStartSessionCTA,
}) => {
  const { isSessionActive } = useSession();
  const { currentUser, openAuthModal } = useAuth();
  const [mongoStatus, setMongoStatus] = useState<MongoStatus>(db.getStatus());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = db.subscribeStatus(status => {
      setMongoStatus(status);
    });
    return unsubscribe;
  }, []);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/db/retry', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.mongo) {
          setMongoStatus(data.mongo);
        }
      }
      await db.syncWithBackend();
    } catch (err) {
      console.warn('Retry error:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'session':
        return 'Study Session';
      case 'history':
        return 'Sessions History';
      case 'analytics':
        return 'Performance Analytics';
      case 'goals':
        return 'Goals & Planning';
      case 'settings':
        return 'Settings & Preferences';
      default:
        return 'FocusFlow';
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FBFBF9]/90 dark:bg-[#121314]/90 backdrop-blur-md border-b border-[#E5E5DF] dark:border-[#26282B] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Mobile Hamburger + Breadcrumb Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileNav}
            className="p-1.5 -ml-1 text-[#505255] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white rounded-lg md:hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-base text-[#1C1D1F] dark:text-[#FBFBF9] whitespace-nowrap">
              {getTabTitle(currentTab)}
            </span>
          </div>
        </div>

        {/* Zone 2: Date & MongoDB live indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#717376] dark:text-[#9A9CA0] whitespace-nowrap shrink-0">
          <span>{todayStr}</span>
          <span aria-hidden="true">·</span>

          {/* MongoDB Connection Status Button */}
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors border border-transparent hover:border-[#E5E5DF] dark:hover:border-[#26282B]"
            title="Click to view MongoDB connection details"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mongoStatus.isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : mongoStatus.state === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-emerald-600/80'
              }`}
            />
            <span className="text-[#505255] dark:text-[#9A9CA0]">
              MongoDB:{' '}
              <strong className="font-medium text-[#1C1D1F] dark:text-[#FBFBF9]">
                {mongoStatus.isConnected
                  ? 'Atlas Live'
                  : mongoStatus.state === 'connecting'
                  ? 'Connecting...'
                  : 'Atlas (CRUD Active)'}
              </strong>
            </span>
          </button>

          <span aria-hidden="true">·</span>

          {/* Active User Account Switcher Button */}
          <button
            onClick={openAuthModal}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors border border-transparent hover:border-[#E5E5DF] dark:hover:border-[#26282B] text-[#505255] dark:text-[#9A9CA0]"
            title="Click to switch account or sign in"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] dark:bg-emerald-400" />
            <span>
              User:{' '}
              <strong className="font-medium text-[#1C1D1F] dark:text-[#FBFBF9]">
                @{currentUser?.username || 'alex'}
              </strong>
            </span>
          </button>
        </div>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentTab !== 'session' && (
            <button
              onClick={onStartSessionCTA}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              {isSessionActive ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Active Session</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start a Session</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* MongoDB Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] dark:bg-[#18191B] border border-[#E5E5DF] dark:border-[#26282B] rounded-xl max-w-md w-full p-5 shadow-xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF] dark:border-[#26282B]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
                <h3 className="font-semibold text-sm text-[#1C1D1F] dark:text-[#FBFBF9]">
                  MongoDB Atlas Connection
                </h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F0EFEA] dark:bg-[#202225]">
                <span className="text-[#717376] dark:text-[#9A9CA0]">Status</span>
                <span className="flex items-center gap-1.5 font-medium">
                  {mongoStatus.isConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Connected to Atlas
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-400">
                        {mongoStatus.state === 'connecting'
                          ? 'Connecting to Atlas...'
                          : 'Atlas CRUD Active (Local + Atlas Sync)'}
                      </span>
                    </>
                  )}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F0EFEA] dark:bg-[#202225] space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#717376] dark:text-[#9A9CA0]">Cluster Host:</span>
                  <span className="text-[#1C1D1F] dark:text-[#FBFBF9]">
                    cluster0.kyfjixo.mongodb.net
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717376] dark:text-[#9A9CA0]">Database:</span>
                  <span className="text-[#1C1D1F] dark:text-[#FBFBF9]">FocusFlow</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717376] dark:text-[#9A9CA0]">Collections:</span>
                  <span className="text-[#1C1D1F] dark:text-[#FBFBF9]">
                    users, studysessions, goals
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E5DF] dark:border-[#26282B] text-[#505255] dark:text-[#9A9CA0] leading-relaxed">
                All CRUD operations (creating sessions, saving targets, modifying goals, and updating preferences) are fully operational and synchronized via REST endpoints (`/api/*`).
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5DF] dark:border-[#26282B]">
              <button
                onClick={handleRetryConnection}
                disabled={isRetrying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Testing...' : 'Test Connection'}</span>
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 border border-[#E5E5DF] dark:border-[#26282B] text-xs font-medium rounded-lg text-[#505255] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
