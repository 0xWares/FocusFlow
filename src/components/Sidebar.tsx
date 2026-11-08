/**
 * FocusFlow Desktop & Mobile Sidebar Navigation.
 */

import React from 'react';
import {
  LayoutDashboard,
  Timer,
  History,
  BarChart3,
  Target,
  Settings,
  Sun,
  Moon,
  Compass,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { ActiveSessionBadge } from './ActiveSessionBadge';

export type NavigationTab = 'dashboard' | 'session' | 'history' | 'analytics' | 'goals' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, updatePreferences, openAuthModal, logout } = useAuth();
  const { isSessionActive } = useSession();

  const isDark = currentUser.preferences?.theme === 'dark';

  const toggleTheme = () => {
    updatePreferences({ theme: isDark ? 'light' : 'dark' });
  };

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'session' as NavigationTab,
      label: isSessionActive ? 'Active Session' : 'New Session',
      icon: Timer,
      highlight: isSessionActive,
    },
    { id: 'history' as NavigationTab, label: 'Sessions History', icon: History },
    { id: 'analytics' as NavigationTab, label: 'Analytics', icon: BarChart3 },
    { id: 'goals' as NavigationTab, label: 'Goals & Planning', icon: Target },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#F5F5F0] dark:bg-[#161719] border-r border-[#E5E5DF] dark:border-[#26282B] flex flex-col justify-between z-50 transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand & Navigation */}
        <div className="p-4 space-y-6">
          {/* Brand Wordmark */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D5A46] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9] block leading-none">
                  FocusFlow
                </span>
                <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] block mt-0.5">
                  Deep Work OS
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white md:hidden"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#E8E8E2] text-[#1C1D1F] dark:bg-[#232528] dark:text-white font-semibold'
                      : 'text-[#505255] hover:text-[#1C1D1F] hover:bg-[#ECECE6] dark:text-[#A0A2A5] dark:hover:text-white dark:hover:bg-[#1C1E21]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2D5A46] dark:text-[#4E9473]' : 'text-[#717376] dark:text-[#7A7D82]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-[#2D5A46] animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Active session pin, Theme Toggle & User Info */}
        <div className="p-4 space-y-3 border-t border-[#E5E5DF] dark:border-[#26282B]">
          {/* Active session mini badge if running and user is browsing other tabs */}
          {isSessionActive && currentTab !== 'session' && (
            <ActiveSessionBadge onReturnToSession={() => handleNavClick('session')} />
          )}

          {/* User Profile Bar */}
          <div className="flex items-center justify-between px-2 pt-1 gap-2">
            <button
              type="button"
              onClick={openAuthModal}
              title="Click to switch account or sign in"
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity flex-1 p-1 -m-1 rounded-lg hover:bg-[#F0EFEA] dark:hover:bg-[#1E2023]"
            >
              <div className="w-8 h-8 rounded-full bg-[#2D5A46]/15 dark:bg-[#2D5A46]/30 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center text-xs font-semibold shrink-0">
                {currentUser.name
                  ? currentUser.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'U'}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] truncate flex items-center gap-1.5">
                  <span>{currentUser.name || 'Student'}</span>
                  {currentUser.username && (
                    <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] font-mono font-normal">
                      @{currentUser.username}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0] truncate">
                  {currentUser.studyField || 'FocusFlow OS'}
                </p>
              </div>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1.5 text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white rounded-md transition-colors shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Account Switch / Sign In CTA */}
          <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-[#717376] dark:text-[#9A9CA0]">
            <button
              type="button"
              onClick={openAuthModal}
              className="hover:text-[#2D5A46] dark:hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
            >
              <span>Switch User</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
