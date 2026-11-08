/**
 * Pure utility functions for the Next Day Planner.
 * Handles time conversions, conflict detection, buffer calculations,
 * metric aggregations, and schedule generation.
 */

import {
  PlannerActivity,
  DailyPlan,
  ActivityCategory,
  StudySession,
  DailyReview,
} from '../types';

export interface TimeInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingActivities: PlannerActivity[];
  message: string;
}

export interface DailyMetrics {
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  totalScheduledMinutes: number;
  totalStudyMinutes: number;
  totalBreakMinutes: number;
  unallocatedMinutes: number;
  plannedStudySessionsCount: number;
}

/**
 * Converts "HH:MM" (24h) to minutes from midnight (0 - 1439).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;
  return Math.min(Math.max(hours * 60 + minutes, 0), 1439);
}

/**
 * Converts minutes from midnight to "HH:MM" (24h).
 */
export function minutesToTime(minutes: number): string {
  const bounded = Math.min(Math.max(Math.floor(minutes), 0), 1439);
  const hrs = Math.floor(bounded / 60);
  const mins = bounded % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes between start and end time.
 * Handles wrap-around if end < start (treats as crossing midnight or bounded to end of day).
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end >= start) {
    return end - start;
  }
  // Wrap-around to midnight
  return 1440 - start + end;
}

/**
 * Formats minutes into readable string e.g. "1h 30m" or "45m".
 */
export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const hours = Math.floor(mins / 60);
  const remainingMins = Math.round(mins % 60);

  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Checks if two time intervals overlap.
 * Intervals [startA, endA) and [startB, endB) overlap if startA < endB && endA > startB.
 */
export function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Detects schedule conflicts between a proposed activity interval and an existing list of activities.
 */
export function detectConflicts(
  startTime: string,
  endTime: string,
  existingActivities: PlannerActivity[],
  ignoreActivityId?: string
): ConflictInfo {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    return {
      hasConflict: true,
      conflictingActivities: [],
      message: 'End time must be after start time.',
    };
  }

  const conflicting = existingActivities.filter(act => {
    if (ignoreActivityId && act.id === ignoreActivityId) return false;
    const actStart = timeToMinutes(act.startTime);
    const actEnd = timeToMinutes(act.endTime);
    return isOverlapping(start, end, actStart, actEnd);
  });

  if (conflicting.length === 0) {
    return {
      hasConflict: false,
      conflictingActivities: [],
      message: 'No conflicts detected.',
    };
  }

  const conflictNames = conflicting.map(c => `"${c.title}" (${c.startTime}–${c.endTime})`).join(', ');
  return {
    hasConflict: true,
    conflictingActivities: conflicting,
    message: `Overlaps with: ${conflictNames}`,
  };
}

/**
 * Checks for gaps between activities to suggest rest buffers (e.g., if two study sessions touch without break).
 */
export function findMissingBuffers(activities: PlannerActivity[]): Array<{
  afterActivityId: string;
  afterTitle: string;
  suggestedTime: string;
  suggestedDuration: number;
}> {
  const sorted = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const suggestions: Array<{
    afterActivityId: string;
    afterTitle: string;
    suggestedTime: string;
    suggestedDuration: number;
  }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = timeToMinutes(current.endTime);
    const nextStart = timeToMinutes(next.startTime);

    // If both are intensive activities (study, work, revision) and back-to-back with 0 gap
    const isCurrentIntensive = ['study', 'revision', 'work', 'learning'].includes(current.category);
    const isNextIntensive = ['study', 'revision', 'work', 'learning'].includes(next.category);

    if (isCurrentIntensive && isNextIntensive && currentEnd === nextStart) {
      suggestions.push({
        afterActivityId: current.id,
        afterTitle: current.title,
        suggestedTime: current.endTime,
        suggestedDuration: 15,
      });
    }
  }

  return suggestions;
}

/**
 * Calculates aggregated daily metrics for a plan.
 */
export function calculateDailyMetrics(activities: PlannerActivity[]): DailyMetrics {
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  let totalScheduledMinutes = 0;
  let totalStudyMinutes = 0;
  let totalBreakMinutes = 0;
  let plannedStudySessionsCount = 0;

  for (const act of activities) {
    const duration = act.durationMinutes || calculateDurationMinutes(act.startTime, act.endTime);
    totalScheduledMinutes += duration;

    const cat = act.category?.toLowerCase() || '';
    if (act.isStudySession || cat === 'study' || cat === 'revision' || cat === 'learning') {
      totalStudyMinutes += duration;
      if (act.isStudySession) plannedStudySessionsCount++;
    } else if (cat === 'break' || cat === 'meals') {
      totalBreakMinutes += duration;
    }
  }

  const unallocatedMinutes = Math.max(1440 - totalScheduledMinutes, 0);

  return {
    totalActivities,
    completedActivities,
    completionRate,
    totalScheduledMinutes,
    totalStudyMinutes,
    totalBreakMinutes,
    unallocatedMinutes,
    plannedStudySessionsCount,
  };
}

/**
 * Compares planned study sessions for a date against actual logged StudySession records.
 */
export function calculatePlannedVsActual(
  plannedActivities: PlannerActivity[],
  actualSessions: StudySession[],
  targetDateStr: string
): {
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  plannedSessionsCount: number;
  actualSessionsCount: number;
  varianceMinutes: number;
  completionPercentage: number;
  linkedCompletedCount: number;
} {
  // Filter planned study sessions
  const studyActivities = plannedActivities.filter(
    a => a.isStudySession || ['study', 'revision', 'learning'].includes(a.category)
  );
  const plannedStudyMinutes = studyActivities.reduce(
    (sum, a) => sum + (a.durationMinutes || calculateDurationMinutes(a.startTime, a.endTime)),
    0
  );

  // Filter actual sessions that occurred on the target date (comparing YYYY-MM-DD)
  const matchingActuals = actualSessions.filter(s => {
    if (!s.sessionDate) return false;
    const sessionDatePart = s.sessionDate.slice(0, 10);
    return sessionDatePart === targetDateStr && s.status === 'completed';
  });

  const actualStudyMinutes = matchingActuals.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
  const varianceMinutes = actualStudyMinutes - plannedStudyMinutes;
  const completionPercentage =
    plannedStudyMinutes > 0
      ? Math.min(Math.round((actualStudyMinutes / plannedStudyMinutes) * 100), 200)
      : actualStudyMinutes > 0
      ? 100
      : 0;

  const linkedCompletedCount = studyActivities.filter(
    a => a.status === 'completed' || !!a.linkedSessionId
  ).length;

  return {
    plannedStudyMinutes,
    actualStudyMinutes,
    plannedSessionsCount: studyActivities.length,
    actualSessionsCount: matchingActuals.length,
    varianceMinutes,
    completionPercentage,
    linkedCompletedCount,
  };
}

/**
 * Returns formatted ISO date string YYYY-MM-DD for today.
 */
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted ISO date string YYYY-MM-DD for tomorrow.
 */
export function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds offsetDays to a given YYYY-MM-DD string.
 */
export function addDays(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date into friendly text like "Tomorrow (Sun, Nov 8)" or "Today (Sat, Nov 7)".
 */
export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDateStr();
  const tomorrow = getTomorrowDateStr();
  const yesterday = addDays(today, -1);

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formatted = dayFormatter.format(dateObj);

  if (dateStr === today) return `Today (${formatted})`;
  if (dateStr === tomorrow) return `Tomorrow (${formatted})`;
  if (dateStr === yesterday) return `Yesterday (${formatted})`;
  return formatted;
}

/**
 * Generates an array of 7 date strings (YYYY-MM-DD) representing the week containing the given date.
 */
export function getWeekDays(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay(); // 0 is Sunday
  // Start week on Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const yr = cur.getFullYear();
    const mo = (cur.getMonth() + 1).toString().padStart(2, '0');
    const da = cur.getDate().toString().padStart(2, '0');
    days.push(`${yr}-${mo}-${da}`);
  }
  return days;
}

/**
 * Category metadata: color tokens, labels, and accents.
 */
export interface CategoryMeta {
  id: ActivityCategory;
  label: string;
  bgLight: string;
  borderLight: string;
  textLight: string;
  bgDark: string;
  borderDark: string;
  textDark: string;
  dotColor: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  study: {
    id: 'study',
    label: 'Deep Study',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textLight: 'text-emerald-900',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-800/60',
    textDark: 'dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  revision: {
    id: 'revision',
    label: 'Revision',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textLight: 'text-indigo-900',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-800/60',
    textDark: 'dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  learning: {
    id: 'learning',
    label: 'Skill Learning',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textLight: 'text-teal-900',
    bgDark: 'dark:bg-teal-950/40',
    borderDark: 'dark:border-teal-800/60',
    textDark: 'dark:text-teal-300',
    dotColor: 'bg-teal-500',
  },
  break: {
    id: 'break',
    label: 'Recovery Break',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textLight: 'text-amber-900',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-800/60',
    textDark: 'dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  exercise: {
    id: 'exercise',
    label: 'Exercise & Health',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textLight: 'text-rose-900',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-800/60',
    textDark: 'dark:text-rose-300',
    dotColor: 'bg-rose-500',
  },
  meals: {
    id: 'meals',
    label: 'Meals & Nutrition',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textLight: 'text-orange-900',
    bgDark: 'dark:bg-orange-950/40',
    borderDark: 'dark:border-orange-800/60',
    textDark: 'dark:text-orange-300',
    dotColor: 'bg-orange-500',
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep & Rest',
    bgLight: 'bg-slate-100',
    borderLight: 'border-slate-300',
    textLight: 'text-slate-800',
    bgDark: 'dark:bg-slate-800/50',
    borderDark: 'dark:border-slate-700',
    textDark: 'dark:text-slate-300',
    dotColor: 'bg-slate-500',
  },
  personal: {
    id: 'personal',
    label: 'Personal & Chores',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textLight: 'text-purple-900',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-800/60',
    textDark: 'dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  work: {
    id: 'work',
    label: 'Project / Work',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textLight: 'text-blue-900',
    bgDark: 'dark:bg-blue-950/40',
    borderDark: 'dark:border-blue-800/60',
    textDark: 'dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  leisure: {
    id: 'leisure',
    label: 'Leisure & Hobbies',
    bgLight: 'bg-emerald-50/50',
    borderLight: 'border-emerald-200/60',
    textLight: 'text-emerald-800',
    bgDark: 'dark:bg-emerald-950/20',
    borderDark: 'dark:border-emerald-900/40',
    textDark: 'dark:text-emerald-400',
    dotColor: 'bg-emerald-400',
  },
  spiritual: {
    id: 'spiritual',
    label: 'Spiritual / Meditation',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textLight: 'text-sky-900',
    bgDark: 'dark:bg-sky-950/40',
    borderDark: 'dark:border-sky-800/60',
    textDark: 'dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  other: {
    id: 'other',
    label: 'Other Activity',
    bgLight: 'bg-stone-50',
    borderLight: 'border-stone-200',
    textLight: 'text-stone-900',
    bgDark: 'dark:bg-stone-900/50',
    borderDark: 'dark:border-stone-700',
    textDark: 'dark:text-stone-300',
    dotColor: 'bg-stone-400',
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  const normalized = category?.toLowerCase();
  return CATEGORY_DEFINITIONS[normalized] || CATEGORY_DEFINITIONS['other'];
}

/**
 * Smart Schedule Assistant Archetypes.
 * Generates structured, science-backed schedule templates.
 */
export interface ScheduleArchetype {
  id: string;
  name: string;
  description: string;
  studyHours: number;
  badge: string;
  generateActivities: (dateStr: string, userId: string) => PlannerActivity[];
}

export const SCHEDULE_ARCHETYPES: ScheduleArchetype[] = [
  {
    id: 'balanced-deep-work',
    name: 'Balanced Deep Work Routine',
    description: '3 focused study sessions (4.5h) with morning routine, exercise, and recovery buffers.',
    studyHours: 4.5,
    badge: 'Recommended',
    generateActivities: (dateStr, userId) => [
      {
        id: `act_${Date.now()}_1`,
        userId,
        date: dateStr,
        title: 'Morning Routine & Intention Setting',
        category: 'personal',
        startTime: '07:00',
        endTime: '07:30',
        durationMinutes: 30,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_2`,
        userId,
        date: dateStr,
        title: 'Morning Light Exercise / Walk',
        category: 'exercise',
        startTime: '07:30',
        endTime: '08:00',
        durationMinutes: 30,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_3`,
        userId,
        date: dateStr,
        title: 'Breakfast & Mindful Transition',
        category: 'meals',
        startTime: '08:00',
        endTime: '08:45',
        durationMinutes: 45,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_4`,
        userId,
        date: dateStr,
        title: 'Deep Work Session 1: Core Subject',
        category: 'study',
        startTime: '09:00',
        endTime: '10:30',
        durationMinutes: 90,
        priority: 'critical',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Core Focus Subject',
          learningObjective: 'Master challenging problem sets and primary concepts',
          targets: [
            { title: 'Solve 5 complex algorithm exercises', priority: 'high' },
            { title: 'Take structured atomic notes', priority: 'medium' },
          ],
          timeBlockType: 'ultradian',
          ultradianWork: 90,
          ultradianBreak: 20,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_5`,
        userId,
        date: dateStr,
        title: 'Active Recovery Break (Hydrate & Stretch)',
        category: 'break',
        startTime: '10:30',
        endTime: '11:00',
        durationMinutes: 30,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_6`,
        userId,
        date: dateStr,
        title: 'Deep Work Session 2: Applied Practice',
        category: 'study',
        startTime: '11:00',
        endTime: '12:30',
        durationMinutes: 90,
        priority: 'high',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Applied Practice',
          learningObjective: 'Apply theoretical principles in code/writing',
          targets: [{ title: 'Implement feature unit tests', priority: 'high' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 25,
          pomodoroBreak: 5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_7`,
        userId,
        date: dateStr,
        title: 'Lunch & Screen-Free Rest',
        category: 'meals',
        startTime: '12:30',
        endTime: '13:45',
        durationMinutes: 75,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_8`,
        userId,
        date: dateStr,
        title: 'Study Session 3: Review & Synthesis',
        category: 'revision',
        startTime: '14:00',
        endTime: '15:30',
        durationMinutes: 90,
        priority: 'medium',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Review & Flashcards',
          learningObjective: 'Spaced repetition and concept consolidation',
          targets: [{ title: 'Review 40 Anki flashcards', priority: 'medium' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 50,
          pomodoroBreak: 10,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_9`,
        userId,
        date: dateStr,
        title: 'Daily Review & Next Day Planning',
        category: 'personal',
        startTime: '17:30',
        endTime: '18:00',
        durationMinutes: 30,
        priority: 'high',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'exam-crunch',
    name: 'Exam Preparation & Intensive Focus',
    description: 'High-intensity 6-hour revision schedule structured around Pomodoro cycles.',
    studyHours: 6.0,
    badge: 'High Intensity',
    generateActivities: (dateStr, userId) => [
      {
        id: `act_${Date.now()}_e1`,
        userId,
        date: dateStr,
        title: 'Morning Wakeup & Hydration',
        category: 'personal',
        startTime: '06:30',
        endTime: '07:15',
        durationMinutes: 45,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_e2`,
        userId,
        date: dateStr,
        title: 'Exam Block 1: Past Paper Simulation',
        category: 'study',
        startTime: '07:30',
        endTime: '09:30',
        durationMinutes: 120,
        priority: 'critical',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Past Papers',
          learningObjective: 'Timed exam simulation under real exam conditions',
          targets: [{ title: 'Complete 2024 Final Exam Paper', priority: 'high' }],
          timeBlockType: 'ultradian',
          ultradianWork: 90,
          ultradianBreak: 20,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_e3`,
        userId,
        date: dateStr,
        title: 'Recovery Break & Healthy Snack',
        category: 'break',
        startTime: '09:30',
        endTime: '10:00',
        durationMinutes: 30,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_e4`,
        userId,
        date: dateStr,
        title: 'Exam Block 2: Error Correction & Theory',
        category: 'revision',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        priority: 'high',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Error Analysis',
          learningObjective: 'Identify and fix weak spots from Paper 1',
          targets: [{ title: 'Log all mistakes in error journal', priority: 'high' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 50,
          pomodoroBreak: 10,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_e5`,
        userId,
        date: dateStr,
        title: 'Nutritious Lunch & Power Nap',
        category: 'meals',
        startTime: '12:00',
        endTime: '13:30',
        durationMinutes: 90,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_e6`,
        userId,
        date: dateStr,
        title: 'Exam Block 3: Formula Memorization & Recall',
        category: 'study',
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        priority: 'high',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Active Recall',
          learningObjective: 'Active blurting and formula proofs',
          targets: [{ title: 'Write out all 15 key formulas from memory', priority: 'high' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 25,
          pomodoroBreak: 5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'after-school',
    name: 'Evening Student / After Classes Routine',
    description: 'Optimized for students attending daytime classes, with 3h evening study.',
    studyHours: 3.0,
    badge: 'Evening Focus',
    generateActivities: (dateStr, userId) => [
      {
        id: `act_${Date.now()}_as1`,
        userId,
        date: dateStr,
        title: 'Decompress from School & Snack',
        category: 'personal',
        startTime: '16:30',
        endTime: '17:15',
        durationMinutes: 45,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_as2`,
        userId,
        date: dateStr,
        title: 'Evening Study 1: Homework & Assignments',
        category: 'study',
        startTime: '17:15',
        endTime: '18:45',
        durationMinutes: 90,
        priority: 'high',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Assignments',
          learningObjective: 'Complete priority assignments due this week',
          targets: [{ title: 'Finish lab report section 2', priority: 'high' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 50,
          pomodoroBreak: 10,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_as3`,
        userId,
        date: dateStr,
        title: 'Dinner & Family Time',
        category: 'meals',
        startTime: '18:45',
        endTime: '19:45',
        durationMinutes: 60,
        priority: 'medium',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_as4`,
        userId,
        date: dateStr,
        title: 'Evening Study 2: Concept Revision',
        category: 'revision',
        startTime: '20:00',
        endTime: '21:30',
        durationMinutes: 90,
        priority: 'high',
        status: 'scheduled',
        isStudySession: true,
        studySessionConfig: {
          subject: 'Lecture Review',
          learningObjective: 'Consolidate today’s lectures into flashcards',
          targets: [{ title: 'Review today’s physics notes', priority: 'medium' }],
          timeBlockType: 'pomodoro',
          pomodoroWork: 25,
          pomodoroBreak: 5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `act_${Date.now()}_as5`,
        userId,
        date: dateStr,
        title: 'Wind-Down & Tomorrow Planning',
        category: 'personal',
        startTime: '21:45',
        endTime: '22:15',
        durationMinutes: 30,
        priority: 'high',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];
