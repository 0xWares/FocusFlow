/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { NewSessionFlow } from './components/session/NewSessionFlow';
import { SessionsHistoryView } from './components/history/SessionsHistoryView';
import { SessionDetailModal } from './components/history/SessionDetailModal';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GoalsView } from './components/goals/GoalsView';
import { SettingsView } from './components/settings/SettingsView';
import { PlannerView } from './components/planner/PlannerView';
import { StudySession, PlannerActivity } from './types';
import { db } from './services/db';
import { AuthModal } from './components/auth/AuthModal';

function MainApp() {
  const { isSessionActive, initNewSession } = useSession();
  const { isAuthModalOpen, closeAuthModal, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [selectedDetailSession, setSelectedDetailSession] = useState<StudySession | null>(null);

  // Auto-start query parameter support (?autostart=1 or tab navigation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        if (!isSessionActive) {
          initNewSession('Deep Focus Session', 'Computer Science');
        }
        setCurrentTab('session');
      } else if (params.get('tab')) {
        const tab = params.get('tab') as NavigationTab;
        if (['dashboard', 'session', 'planner', 'history', 'analytics', 'goals', 'settings'].includes(tab)) {
          setCurrentTab(tab);
        }
      }
    }
  }, []);

  const handleStartSessionCTA = () => {
    if (!isSessionActive) {
      initNewSession();
    }
    setCurrentTab('session');
  };

  const handleStartPlannedSession = (activity: PlannerActivity) => {
    const cfg = activity.studySessionConfig;
    const studyTargets = cfg?.targets?.map((t, idx) => ({
      id: `tgt_${Date.now()}_${idx}`,
      title: t.title,
      priority: t.priority,
      completed: false,
    }));

    initNewSession(activity.title, cfg?.subject || activity.title, {
      linkedActivityId: activity.id,
      plannedDuration: activity.durationMinutes,
      timeBlockType: cfg?.timeBlockType || 'pomodoro',
      intention: cfg?.learningObjective,
      targets: studyTargets,
      pomodoroWork: cfg?.pomodoroWork,
      pomodoroBreak: cfg?.pomodoroBreak,
      ultradianWork: cfg?.ultradianWork,
      ultradianBreak: cfg?.ultradianBreak,
      preferredTechniques: cfg?.preferredTechniques,
    });
    setCurrentTab('session');
  };

  const handleSessionSaved = () => {
    setCurrentTab('dashboard');
  };

  const handleDeleteSession = (id: string) => {
    db.deleteSession(id);
    setSelectedDetailSession(null);
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBF9] dark:bg-[#121314] text-[#1C1D1F] dark:text-[#E8E8E6] transition-colors">
      {/* Sidebar (Desktop sticky + Mobile drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar Navigation */}
        <Header
          currentTab={currentTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onStartSessionCTA={handleStartSessionCTA}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onStartSession={handleStartSessionCTA}
              onViewAllSessions={() => setCurrentTab('history')}
              onSelectSessionDetail={session => setSelectedDetailSession(session)}
              onViewGoals={() => setCurrentTab('goals')}
              onNavigateToPlanner={() => setCurrentTab('planner')}
            />
          )}

          {currentTab === 'session' && (
            <NewSessionFlow onSessionSaved={handleSessionSaved} />
          )}

          {currentTab === 'planner' && (
            <PlannerView onStartPlannedSession={handleStartPlannedSession} />
          )}

          {currentTab === 'history' && <SessionsHistoryView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'goals' && <GoalsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Direct Detail Modal from Dashboard or Anywhere */}
      {selectedDetailSession && (
        <SessionDetailModal
          session={selectedDetailSession}
          onClose={() => setSelectedDetailSession(null)}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Authentication & User Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || !isAuthenticated}
        onClose={closeAuthModal}
        canDismiss={isAuthenticated}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <MainApp />
      </SessionProvider>
    </AuthProvider>
  );
}
