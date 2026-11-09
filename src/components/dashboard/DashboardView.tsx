/**
 * FocusFlow Central Dashboard View.
 * Displays executive study metrics, daily/weekly goals, activity heatmap,
 * recent study sessions, and quick session launcher.
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  Smile,
  Zap,
  Activity,
  Layers,
  Trash2,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { db } from '../../services/db';
import { Heatmap } from './Heatmap';
import {
  calculateStreak,
  calculateTotalHours,
  formatDuration,
} from '../../utils/sessionMath';
import { StudySession, Goal } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface DashboardViewProps {
  onStartSession: () => void;
  onViewAllSessions: () => void;
  onSelectSessionDetail: (session: StudySession) => void;
  onViewGoals: () => void;
  onNavigateToPlanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartSession,
  onViewAllSessions,
  onSelectSessionDetail,
  onViewGoals,
  onNavigateToPlanner,
}) => {
  const { currentUser } = useAuth();
  const { isSessionActive } = useSession();

  const [sessions, setSessions] = useState<StudySession[]>(() => db.getSessions(currentUser.id));
  const [goals, setGoals] = useState<Goal[]>(() => db.getGoals(currentUser.id));
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  useEffect(() => {
    const updateData = () => {
      setSessions(db.getSessions(currentUser.id));
      setGoals(db.getGoals(currentUser.id));
    };
    updateData();
    return db.subscribeData(updateData);
  }, [currentUser.id]);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Metrics calculations
  const todayIso = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(
    s => s.status === 'completed' && s.sessionDate.startsWith(todayIso)
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.actualDuration, 0);

  const { currentStreak, longestStreak } = calculateStreak(sessions);
  const totalCompletedSessions = sessions.filter(s => s.status === 'completed').length;

  // Averages across completed sessions
  const completedSessions = sessions.filter(s => s.status === 'completed' && s.averageScore > 0);
  const avgFocus =
    completedSessions.length > 0
      ? Math.round(
          (completedSessions.reduce((sum, s) => sum + s.focusRating, 0) /
            completedSessions.length) *
            10
        ) / 10
      : 0;

  const avgEnergy =
    completedSessions.length > 0
      ? Math.round(
          (completedSessions.reduce((sum, s) => sum + s.energyRating, 0) /
            completedSessions.length) *
            10
        ) / 10
      : 0;

  const avgSatisfaction =
    completedSessions.length > 0
      ? Math.round(
          (completedSessions.reduce((sum, s) => sum + s.satisfactionRating, 0) /
            completedSessions.length) *
            10
        ) / 10
      : 0;

  const overallAvgScore =
    completedSessions.length > 0
      ? Math.round(
          (completedSessions.reduce((sum, s) => sum + s.averageScore, 0) /
            completedSessions.length) *
            10
        ) / 10
      : 0;

  // Weekly study time (last 7 days)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const thisWeekSessions = sessions.filter(
    s => s.status === 'completed' && new Date(s.sessionDate) >= weekStart
  );
  const thisWeekHours = Math.round((thisWeekSessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60) * 10) / 10;
  const weeklyTargetHours = 24;
  const weeklyPercent = Math.min(100, Math.round((thisWeekHours / weeklyTargetHours) * 100));

  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Welcome & Quick Start Banner */}
      <div className="bg-[#F5F5F0] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span>{todayStr}</span>
            <span aria-hidden="true">·</span>
            <span>FocusFlow System Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
            {greeting}, {currentUser.name}
          </h1>
          <p className="text-sm text-[#505255] dark:text-[#A0A2A5] max-w-xl">
            Prepare your environment and mind, enter your deep work bliss station, and preserve your progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onNavigateToPlanner && (
            <button
              onClick={onNavigateToPlanner}
              className="flex items-center gap-2 px-4 py-3 bg-[#FFFFFF] dark:bg-[#202225] border border-[#E5E5DF] dark:border-[#2C2E33] hover:bg-[#F0F0EB] dark:hover:bg-[#282A30] text-[#1C1D1F] dark:text-[#FBFBF9] text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
              <span>Plan Tomorrow</span>
            </button>
          )}

          <button
            onClick={onStartSession}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-sm font-semibold rounded-xl shadow-sm transition-all transform active:scale-98 whitespace-nowrap"
          >
            {isSessionActive ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Resume Active Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start a Session</span>
              </>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (60-30-10 discipline, tabular figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Time */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-xl p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span>Study Time Today</span>
            <Clock className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
          </div>
          <p className="text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
            {formatDuration(todayMinutes)}
          </p>
          <div className="text-xs text-[#717376] dark:text-[#9A9CA0] flex items-center gap-1.5">
            <span>{todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'} completed today</span>
          </div>
        </div>

        {/* Metric 2: Daily Streak */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-xl p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span>Daily Study Streak</span>
            <Flame className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
              {currentStreak}
            </p>
            <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">days</span>
          </div>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            Personal best: <span className="font-mono tabular-nums">{longestStreak} days</span>
          </p>
        </div>

        {/* Metric 3: Weekly Progress */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-xl p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span>Weekly Progress</span>
            <Target className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
              {thisWeekHours}
            </p>
            <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">/ {weeklyTargetHours}h target</span>
          </div>
          <div className="w-full bg-[#EAEAE4] dark:bg-[#26282B] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2D5A46] dark:bg-[#4E9473] h-full rounded-full transition-all duration-500"
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Average Focus Score */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-xl p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span>Average Session Score</span>
            <Activity className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
              {overallAvgScore.toFixed(1)}
            </p>
            <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">/ 10</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#717376] dark:text-[#9A9CA0]">
            <span>Focus: <strong className="text-[#1C1D1F] dark:text-[#E8E8E6] font-mono">{avgFocus.toFixed(1)}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Energy: <strong className="text-[#1C1D1F] dark:text-[#E8E8E6] font-mono">{avgEnergy.toFixed(1)}</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Activity Heatmap + Goals Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Section (2 cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Study Activity & Intensity
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Consistent deliberate work builds sustainable momentum
              </p>
            </div>
            <div className="text-xs font-mono tabular-nums text-[#717376] dark:text-[#9A9CA0]">
              Total: {calculateTotalHours(sessions)}h studied
            </div>
          </div>

          <Heatmap sessions={sessions} daysCount={70} />
        </div>

        {/* Goals & Planning Widget (1 col) */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Active Goals
                </h2>
                <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                  Target milestones
                </p>
              </div>
              <button
                onClick={onViewGoals}
                className="text-xs text-[#2D5A46] dark:text-[#4E9473] font-medium hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {goals.slice(0, 3).map(goal => {
                const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                return (
                  <div key={goal.id} className="space-y-1.5 p-2.5 rounded-lg bg-[#F8F8F6] dark:bg-[#1E2023] border border-[#EAEAE4] dark:border-[#282A2E]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1C1D1F] dark:text-[#FBFBF9] truncate pr-2">
                        {goal.title}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-[#717376] dark:text-[#9A9CA0] shrink-0">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <div className="w-full bg-[#E0E0DA] dark:bg-[#2C2F33] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2D5A46] dark:bg-[#4E9473] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onViewGoals}
            className="w-full py-2 border border-[#E5E5DF] dark:border-[#26282B] rounded-lg text-xs font-medium text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5] dark:hover:text-white transition-colors text-center"
          >
            Manage Study Goals
          </button>
        </div>
      </div>

      {/* Recent Study Sessions Table/List */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Recent Study Sessions
            </h2>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
              Complete record of your structured sessions
            </p>
          </div>

          <button
            onClick={onViewAllSessions}
            className="text-xs text-[#2D5A46] dark:text-[#4E9473] font-medium hover:underline flex items-center gap-1"
          >
            <span>View all sessions ({sessions.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-[#717376] dark:text-[#9A9CA0]">
              No study sessions logged yet. Begin your first structured flow today.
            </p>
            <button
              onClick={onStartSession}
              className="px-4 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
            >
              Start First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EFEFEA] dark:divide-[#232528]">
            {recentSessions.map(session => {
              const dateFormatted = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(session.sessionDate));

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSessionDetail(session)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F9F7] dark:hover:bg-[#1B1D20] px-3 -mx-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] truncate">
                        {session.title}
                      </h3>
                      <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] shrink-0 capitalize">
                        {session.timeBlockType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#717376] dark:text-[#9A9CA0]">
                      <span>{session.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dateFormatted}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatDuration(session.actualDuration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Score display (unboxed per anti-slop rules) */}
                    <div className="text-right">
                      <div className="text-xs font-medium text-[#717376] dark:text-[#9A9CA0]">
                        Session Score
                      </div>
                      <div className="text-sm font-bold font-mono tabular-nums text-[#2D5A46] dark:text-[#4E9473]">
                        {session.averageScore.toFixed(1)} / 10
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-[#717376] dark:text-[#9A9CA0] hidden md:block">
                      <span>Targets: {session.targets?.filter(t => t.completed).length || 0}/{session.targets?.length || 0}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session);
                      }}
                      className="p-1.5 rounded-lg text-[#A0A2A5] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete study session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Study Session"
        description={`Are you sure you want to delete "${sessionToDelete?.title}"? This study session will be permanently removed.`}
        confirmLabel="Delete Session"
        isDestructive={true}
        onConfirm={() => {
          if (sessionToDelete) {
            db.deleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onClose={() => setSessionToDelete(null)}
      />
    </div>
  );
};
