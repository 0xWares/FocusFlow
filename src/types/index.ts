/**
 * FocusFlow Type Definitions
 */

export type TimeBlockType = 'pomodoro' | 'ultradian';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type PerformanceTechnique = 'dot-focus' | 'spiral' | 'dua' | 'visualization';

export type SessionPhase = 'preparation' | 'performance' | 'preservation' | 'completed';

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface StudyTarget {
  id: string;
  title: string;
  description?: string;
  expectedOutcome?: string;
  priority: PriorityLevel;
  completed: boolean;
}

export interface PreparationData {
  timeBlockType: TimeBlockType;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroCycles: number;
  ultradianWorkMinutes: number;
  ultradianBreakMinutes: number;
  spaceChecklist: ChecklistItem[];
  energyChecklist: ChecklistItem[];
  energyConfirmed: boolean;
  resourceChecklist: ChecklistItem[];
  resourcesConfirmed: boolean;
  intention: string;
  targets: StudyTarget[];
  mood: string;
  mentalClarity: string;
  distractions: string;
  mindReady: boolean;
}

export interface SessionNotes {
  summary: string;
  conceptsLearned: string[];
  problemsSolved: string[];
  ideasDiscovered: string[];
  unfinishedTasks: string[];
  questions: string[];
  reminders: string[];
  markdownNotes: string;
}

export interface ClosingData {
  organizeChecklist: ChecklistItem[];
  breathingCompleted: boolean;
  breathingDurationSeconds: number;
  gratitudeReflection: string;
}

export interface StudySession {
  id: string;
  userId: string;
  title: string;
  subject: string;
  sessionDate: string; // ISO string
  timeBlockType: TimeBlockType;
  plannedDuration: number; // in minutes
  actualDuration: number; // in minutes
  breakDuration: number; // in minutes
  preparation: PreparationData;
  selectedTechniques: PerformanceTechnique[];
  targets: StudyTarget[];
  sessionNotes: SessionNotes;
  closingActivities: ClosingData;
  focusRating: number; // 1 to 10
  energyRating: number; // 1 to 10
  satisfactionRating: number; // 1 to 10
  averageScore: number; // (focus + energy + satisfaction) / 3
  reflection: string;
  status: 'completed' | 'abandoned';
  linkedActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: 'daily' | 'weekly';
  targetValue: number; // hours or count
  currentValue: number;
  unit: 'hours' | 'sessions' | 'targets';
  deadline?: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface UserPreferences {
  defaultPomodoroWork: number;
  defaultPomodoroBreak: number;
  defaultUltradianWork: number;
  defaultUltradianBreak: number;
  soundEnabled: boolean;
  ambientSound: 'none' | 'rain' | 'white-noise' | 'stream';
  ambientVolume: number;
  theme: 'light' | 'dark';
  defaultSpaceChecklist: string[];
  defaultEnergyChecklist: string[];
  defaultResourceChecklist: string[];
  defaultClosingChecklist: string[];
  preferredTechnique: PerformanceTechnique;
  dailyHourTarget: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
  studyField: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface ActiveTimerState {
  sessionId: string;
  status: 'idle' | 'running' | 'paused' | 'break';
  phase: 'focus' | 'break';
  currentCycle: number;
  totalCycles: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalTargetSeconds: number;
  lastTickTimestamp: number | null;
}

// ==========================================
// NEXT DAY PLANNER TYPES
// ==========================================

export type ActivityCategory =
  | 'study'
  | 'revision'
  | 'learning'
  | 'exercise'
  | 'personal'
  | 'meals'
  | 'break'
  | 'sleep'
  | 'spiritual'
  | 'work'
  | 'leisure'
  | 'other'
  | string;

export type ActivityPriority = 'critical' | 'high' | 'medium' | 'low';

export type ActivityStatus = 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled';

export interface PlannedStudySessionConfig {
  subject: string;
  learningObjective?: string;
  targets: Array<{ title: string; priority: PriorityLevel }>;
  timeBlockType: TimeBlockType;
  pomodoroWork?: number;
  pomodoroBreak?: number;
  ultradianWork?: number;
  ultradianBreak?: number;
  preferredTechniques?: PerformanceTechnique[];
}

export interface PlannerActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  category: ActivityCategory;
  startTime: string; // HH:MM, e.g. "08:00"
  endTime: string; // HH:MM, e.g. "09:30"
  durationMinutes: number; // calculated
  priority: ActivityPriority;
  status: ActivityStatus;
  isFixed?: boolean;
  isFlexible?: boolean;
  reminderMinutesBefore?: number;
  repeat?: 'none' | 'daily' | 'weekly';
  notes?: string;
  linkedGoalId?: string;
  linkedSessionId?: string;
  isStudySession?: boolean;
  studySessionConfig?: PlannedStudySessionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TopPriority {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority: ActivityPriority;
  completed: boolean;
  linkedActivityId?: string;
}

export interface SecondaryTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyReview {
  completedActivitiesCount: number;
  skippedActivitiesCount: number;
  rescheduledActivitiesCount: number;
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  completionRate: number;
  whatWentWell: string;
  whatToImprove: string;
  evaluation: string;
  completedAt: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title?: string;
  topPriorities: TopPriority[];
  secondaryTasks: SecondaryTask[];
  activities: PlannerActivity[];
  dailyReview?: DailyReview;
  status: 'draft' | 'planned' | 'in-progress' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

