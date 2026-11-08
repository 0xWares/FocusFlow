/**
 * Analytics & Insights Dashboard.
 * Visual analytics, trends, time distribution, technique comparisons,
 * and data-grounded performance insights.
 */

import React, { useState } from 'react';
import {
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Smile,
  Flame,
  Award,
  Sparkles,
  BarChart,
  PieChart,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  calculateStreak,
  calculateTotalHours,
  formatDuration,
  generatePerformanceInsights,
} from '../../utils/sessionMath';

export const AnalyticsView: React.FC = () => {
  const { currentUser } = useAuth();
  const sessions = db.getSessions(currentUser.id).filter(s => s.status === 'completed');

  const [timeRange, setTimeRange] = useState<'7days' | '14days' | '30days'>('7days');

  // Overall Statistics
  const totalHours = calculateTotalHours(sessions);
  const totalSessionsCount = sessions.length;
  const avgDurationMinutes =
    totalSessionsCount > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.actualDuration, 0) / totalSessionsCount)
      : 0;

  const avgFocus =
    totalSessionsCount > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.focusRating, 0) / totalSessionsCount) * 10) / 10
      : 0;

  const avgEnergy =
    totalSessionsCount > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.energyRating, 0) / totalSessionsCount) * 10) / 10
      : 0;

  const avgSatisfaction =
    totalSessionsCount > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.satisfactionRating, 0) / totalSessionsCount) * 10) / 10
      : 0;

  const { currentStreak, longestStreak } = calculateStreak(sessions);

  // Daily study time data for chart
  const daysLimit = timeRange === '7days' ? 7 : timeRange === '14days' ? 14 : 30;
  const dailyData: { label: string; dateStr: string; minutes: number; score: number }[] = [];
  const today = new Date();

  for (let i = daysLimit - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);

    const matching = sessions.filter(s => s.sessionDate.startsWith(dateStr));
    const mins = matching.reduce((sum, s) => sum + s.actualDuration, 0);
    const avgScore =
      matching.length > 0
        ? matching.reduce((sum, s) => sum + s.averageScore, 0) / matching.length
        : 0;

    dailyData.push({
      label: dayName,
      dateStr,
      minutes: mins,
      score: avgScore,
    });
  }

  const maxMinutes = Math.max(120, ...dailyData.map(d => d.minutes));

  // Pomodoro vs Ultradian comparison
  const pomodoroSessions = sessions.filter(s => s.timeBlockType === 'pomodoro');
  const ultradianSessions = sessions.filter(s => s.timeBlockType === 'ultradian');

  const pomoTotalMins = pomodoroSessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const ultraTotalMins = ultradianSessions.reduce((sum, s) => sum + s.actualDuration, 0);

  const pomoAvgScore =
    pomodoroSessions.length > 0
      ? Math.round((pomodoroSessions.reduce((sum, s) => sum + s.averageScore, 0) / pomodoroSessions.length) * 10) / 10
      : 0;

  const ultraAvgScore =
    ultradianSessions.length > 0
      ? Math.round((ultradianSessions.reduce((sum, s) => sum + s.averageScore, 0) / ultradianSessions.length) * 10) / 10
      : 0;

  // Real performance insights
  const insights = generatePerformanceInsights(sessions);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
            Analytics & Performance Insights
          </h1>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            Empirical measurements of focus, energy consistency, and study rhythm
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EAEAE4] dark:bg-[#202225] rounded-xl text-xs">
          {[
            { id: '7days', label: '7 Days' },
            { id: '14days', label: '14 Days' },
            { id: '30days', label: '30 Days' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === r.id
                  ? 'bg-white dark:bg-[#18191C] text-[#1C1D1F] dark:text-white shadow-xs'
                  : 'text-[#717376] dark:text-[#9A9CA0]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Strip (tabular numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 md:p-5 space-y-1.5 shadow-xs">
          <span className="text-xs text-[#717376] dark:text-[#9A9CA0] block">Total Focus Hours</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-[#1C1D1F] dark:text-[#FBFBF9] tabular-nums">
            {totalHours}h
          </p>
          <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
            Across {totalSessionsCount} study sessions
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 md:p-5 space-y-1.5 shadow-xs">
          <span className="text-xs text-[#717376] dark:text-[#9A9CA0] block">Avg Session Length</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-[#1C1D1F] dark:text-[#FBFBF9] tabular-nums">
            {avgDurationMinutes}m
          </p>
          <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
            Per intentional deep work block
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 md:p-5 space-y-1.5 shadow-xs">
          <span className="text-xs text-[#717376] dark:text-[#9A9CA0] block">Average Focus Rating</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
            {avgFocus.toFixed(1)}/10
          </p>
          <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
            Self-reported deep concentration
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 md:p-5 space-y-1.5 shadow-xs">
          <span className="text-xs text-[#717376] dark:text-[#9A9CA0] block">Daily Study Streak</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-[#D97706] tabular-nums">
            {currentStreak} days
          </p>
          <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
            Longest run: {longestStreak} days
          </span>
        </div>
      </div>

      {/* Main Bar Chart: Daily Study Time */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Daily Deliberate Study Time
            </h2>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
              Minutes logged per day over the selected window
            </p>
          </div>
          <span className="text-xs font-mono text-[#717376] dark:text-[#9A9CA0]">
            Target: 120m/day
          </span>
        </div>

        {/* Custom SVG / HTML Bar Chart */}
        <div className="h-48 md:h-56 flex items-end gap-2 md:gap-3 pt-6 pb-2 border-b border-[#EAEAE4] dark:border-[#26282B]">
          {dailyData.map(d => {
            const heightPercent = maxMinutes > 0 ? Math.round((d.minutes / maxMinutes) * 100) : 0;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                {/* Tooltip value */}
                <span className="text-[10px] font-mono tabular-nums text-[#717376] opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDuration(d.minutes)}
                </span>

                {/* The Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    d.minutes >= 90
                      ? 'bg-[#2D5A46] dark:bg-[#4E9473]'
                      : d.minutes > 0
                      ? 'bg-[#5B9577] dark:bg-[#3A7559]'
                      : 'bg-[#EAEAE4] dark:bg-[#232528]'
                  }`}
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                />

                {/* Day label */}
                <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] font-mono mt-1">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Score Trends & Technique Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trends Breakdown */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Subjective Performance Metrics (1–10)
            </h2>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
              Balance between mental focus, physical energy, and output satisfaction
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Focus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
                  <span>Mental Focus</span>
                </span>
                <span className="font-mono font-bold text-sm text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                  {avgFocus.toFixed(1)} / 10
                </span>
              </div>
              <div className="w-full bg-[#EAEAE4] dark:bg-[#232528] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2D5A46] dark:bg-[#4E9473] h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgFocus * 10}%` }}
                />
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#D97706]" />
                  <span>Physical Energy</span>
                </span>
                <span className="font-mono font-bold text-sm text-[#D97706] tabular-nums">
                  {avgEnergy.toFixed(1)} / 10
                </span>
              </div>
              <div className="w-full bg-[#EAEAE4] dark:bg-[#232528] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgEnergy * 10}%` }}
                />
              </div>
            </div>

            {/* Satisfaction */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] flex items-center gap-2">
                  <Smile className="w-4 h-4 text-[#3A7559]" />
                  <span>Session Satisfaction</span>
                </span>
                <span className="font-mono font-bold text-sm text-[#3A7559] tabular-nums">
                  {avgSatisfaction.toFixed(1)} / 10
                </span>
              </div>
              <div className="w-full bg-[#EAEAE4] dark:bg-[#232528] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#3A7559] h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgSatisfaction * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technique Comparison: Pomodoro vs Ultradian */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Pomodoro vs. Ultradian Rhythm
            </h2>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
              Comparative breakdown of focus efficiency by technique
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Pomodoro Box */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                <span>Pomodoro</span>
                <span className="font-mono text-[11px] text-[#717376]">{pomodoroSessions.length} sessions</span>
              </div>
              <p className="text-lg font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                {formatDuration(pomoTotalMins)}
              </p>
              <div className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                Avg Score: <strong className="text-[#1C1D1F] dark:text-white font-mono">{pomoAvgScore.toFixed(1)}/10</strong>
              </div>
            </div>

            {/* Ultradian Box */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                <span>Ultradian</span>
                <span className="font-mono text-[11px] text-[#717376]">{ultradianSessions.length} sessions</span>
              </div>
              <p className="text-lg font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                {formatDuration(ultraTotalMins)}
              </p>
              <div className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                Avg Score: <strong className="text-[#1C1D1F] dark:text-white font-mono">{ultraAvgScore.toFixed(1)}/10</strong>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#505255] dark:text-[#A0A2A5] pt-1">
            {pomoAvgScore >= ultraAvgScore
              ? 'Pomodoro sprints currently yield higher focus consistency for your study patterns.'
              : 'Ultradian 90-minute blocks produce deeper continuous immersion for analytical subjects.'}
          </p>
        </div>
      </div>

      {/* Data-Grounded Performance Insights Section */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Behavioral Insights & Study Patterns
            </h2>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
              Empirically calculated from your session preparation, checklists, and evaluations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F8F8F6] dark:bg-[#151618] border border-[#EAEAE4] dark:border-[#26282B] text-xs text-[#1C1D1F] dark:text-[#E8E8E6] flex items-start gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] dark:bg-[#4E9473] shrink-0 mt-1.5" />
              <p className="leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
