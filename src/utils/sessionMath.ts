/**
 * Pure mathematical, statistical, and streak calculation utilities for FocusFlow.
 */

import { StudySession } from '../types';

/**
 * Calculates the average session score from 1-10 metrics.
 * Formula: (Focus + Energy + Satisfaction) / 3 rounded to 1 decimal place.
 */
export function calculateAverageScore(focus: number, energy: number, satisfaction: number): number {
  if (!focus && !energy && !satisfaction) return 0;
  const raw = (focus + energy + satisfaction) / 3;
  return Math.round(raw * 10) / 10;
}

/**
 * Calculates current and longest consecutive study day streaks.
 */
export function calculateStreak(sessions: StudySession[], referenceDate: Date = new Date()): { currentStreak: number; longestStreak: number } {
  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Extract unique sorted calendar days (YYYY-MM-DD)
  const daysSet = new Set<string>();
  for (const s of sessions) {
    if (s.status === 'completed' && s.actualDuration > 0) {
      const d = new Date(s.sessionDate);
      if (!isNaN(d.getTime())) {
        const isoDay = d.toISOString().split('T')[0];
        daysSet.add(isoDay);
      }
    }
  }

  const sortedDays = Array.from(daysSet).sort();
  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dayStr of sortedDays) {
    const curDate = new Date(dayStr + 'T00:00:00Z');
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = curDate;
  }

  // Calculate current streak relative to referenceDate
  const refDayStr = referenceDate.toISOString().split('T')[0];
  const refDate = new Date(refDayStr + 'T00:00:00Z');
  const yesterday = new Date(refDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  // If user studied today or yesterday, streak is alive
  if (daysSet.has(refDayStr) || daysSet.has(yesterdayStr)) {
    let checkDate = daysSet.has(refDayStr) ? new Date(refDate) : new Date(yesterday);
    while (true) {
      const dayStr = checkDate.toISOString().split('T')[0];
      if (daysSet.has(dayStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Calculates total study hours rounded to 1 decimal place.
 */
export function calculateTotalHours(sessions: StudySession[]): number {
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Calculates target completion percentage.
 */
export function calculateTargetCompletionRate(targets: { completed: boolean }[]): number {
  if (!targets || targets.length === 0) return 0;
  const completed = targets.filter(t => t.completed).length;
  return Math.round((completed / targets.length) * 100);
}

/**
 * Formats duration in minutes into clean readable text: e.g. "1h 45m" or "25m".
 */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS.
 */
export function formatTimerSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Generates data-grounded performance insights from study session records.
 * Returns only genuine, data-backed insights without assumptions.
 */
export function generatePerformanceInsights(sessions: StudySession[]): string[] {
  const completed = sessions.filter(s => s.status === 'completed' && s.actualDuration > 0);
  if (completed.length < 3) {
    return [
      'Complete at least 3 structured sessions to reveal behavioral and focus patterns.',
      'Establishing a steady preparation ritual helps build automatic flow states.'
    ];
  }

  const insights: string[] = [];

  // 1. Time of day analysis (Morning <12pm vs Afternoon 12-5pm vs Evening >5pm)
  const morning = completed.filter(s => new Date(s.sessionDate).getHours() < 12);
  const afternoon = completed.filter(s => {
    const h = new Date(s.sessionDate).getHours();
    return h >= 12 && h < 17;
  });
  const evening = completed.filter(s => new Date(s.sessionDate).getHours() >= 17);

  const avgFocus = (list: StudySession[]) =>
    list.length > 0 ? list.reduce((sum, s) => sum + s.focusRating, 0) / list.length : 0;

  const morningFocus = avgFocus(morning);
  const eveningFocus = avgFocus(evening);
  const afternoonFocus = avgFocus(afternoon);

  if (morning.length >= 2 && morningFocus > eveningFocus && morningFocus > afternoonFocus) {
    insights.push(`Your focus scores average ${(morningFocus).toFixed(1)}/10 in the morning, noticeably higher than later sessions.`);
  } else if (evening.length >= 2 && eveningFocus > morningFocus) {
    insights.push(`Your focus scores peak during evening sessions, averaging ${(eveningFocus).toFixed(1)}/10.`);
  }

  // 2. Preparation Checklist Correlation
  const thoroughPrep = completed.filter(s => {
    const spaceChecks = s.preparation?.spaceChecklist?.filter(i => i.checked).length || 0;
    return spaceChecks >= 4 && s.preparation?.mindReady;
  });
  const partialPrep = completed.filter(s => !thoroughPrep.includes(s));

  if (thoroughPrep.length >= 2 && partialPrep.length >= 2) {
    const thoroughScore = avgFocus(thoroughPrep);
    const partialScore = avgFocus(partialPrep);
    if (thoroughScore > partialScore + 0.5) {
      insights.push(`Sessions with complete physical & mental preparation average ${(thoroughScore).toFixed(1)}/10 focus compared to ${(partialScore).toFixed(1)}/10 for partial prep.`);
    }
  }

  // 3. Technique comparison (Pomodoro vs Ultradian)
  const pomodoros = completed.filter(s => s.timeBlockType === 'pomodoro');
  const ultradians = completed.filter(s => s.timeBlockType === 'ultradian');

  if (pomodoros.length >= 2 && ultradians.length >= 2) {
    const pomoAvg = pomodoros.reduce((sum, s) => sum + s.averageScore, 0) / pomodoros.length;
    const ultraAvg = ultradians.reduce((sum, s) => sum + s.averageScore, 0) / ultradians.length;
    if (Math.abs(pomoAvg - ultraAvg) >= 0.5) {
      const winner = pomoAvg > ultraAvg ? 'Pomodoro' : 'Ultradian Rhythm';
      insights.push(`You report higher overall session satisfaction and energy with the ${winner} technique.`);
    }
  }

  // 4. Target definition impact
  const withTargets = completed.filter(s => s.targets && s.targets.length > 0);
  const withoutTargets = completed.filter(s => !s.targets || s.targets.length === 0);
  if (withTargets.length >= 2 && withoutTargets.length >= 2) {
    const withAvg = withTargets.reduce((sum, s) => sum + s.satisfactionRating, 0) / withTargets.length;
    const withoutAvg = withoutTargets.reduce((sum, s) => sum + s.satisfactionRating, 0) / withoutTargets.length;
    if (withAvg > withoutAvg) {
      insights.push(`Defining specific targets before studying correlates with higher session satisfaction (+${(withAvg - withoutAvg).toFixed(1)} points).`);
    }
  }

  // 5. Recent trend (last 5 sessions vs previous)
  if (completed.length >= 6) {
    const recent = completed.slice(-3);
    const previous = completed.slice(-6, -3);
    const recentAvg = recent.reduce((sum, s) => sum + s.averageScore, 0) / 3;
    const prevAvg = previous.reduce((sum, s) => sum + s.averageScore, 0) / 3;
    if (recentAvg > prevAvg + 0.3) {
      insights.push(`Your session performance has improved by +${(recentAvg - prevAvg).toFixed(1)} points over your last three sessions.`);
    }
  }

  if (insights.length === 0) {
    insights.push('Consistency is steady across your recent sessions. Keep refining your physical space setup for deeper flow.');
  }

  return insights;
}
