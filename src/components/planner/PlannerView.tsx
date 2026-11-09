import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Sparkles,
  Sun,
  Award,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Coffee,
  ListTodo,
  Check,
  Trash2,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  DailyPlan,
  PlannerActivity,
  TopPriority,
  SecondaryTask,
  DailyReview,
  ActivityPriority,
  ActivityStatus,
} from '../../types';
import { db } from '../../services/db';
import {
  getTomorrowDateStr,
  getTodayDateStr,
  addDays,
  formatDisplayDate,
  calculateDailyMetrics,
  formatMinutes,
  detectConflicts,
} from '../../utils/planner';
import { TimelineDayView } from './TimelineDayView';
import { TimelineWeekView } from './TimelineWeekView';
import { TimelineMonthView } from './TimelineMonthView';
import { ActivityModal } from './ActivityModal';
import { SmartScheduleAssistantModal } from './SmartScheduleAssistantModal';
import { MorningBriefingModal } from './MorningBriefingModal';
import { DailyReviewModal } from './DailyReviewModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PlannerViewProps {
  onStartPlannedSession: (activity: PlannerActivity) => void;
}

type PlannerTabMode = 'day' | 'week' | 'month';

export const PlannerView: React.FC<PlannerViewProps> = ({ onStartPlannedSession }) => {
  // Default to tomorrow per the feature brief: "Plan Your Tomorrow"
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDateStr());
  const [viewMode, setViewMode] = useState<PlannerTabMode>('day');
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(null);
  const [allPlans, setAllPlans] = useState<DailyPlan[]>([]);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivityToEdit, setSelectedActivityToEdit] = useState<PlannerActivity | null>(null);
  const [initialTimeForModal, setInitialTimeForModal] = useState<string>('09:00');

  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Confirm delete dialog state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    activityId?: string;
    title?: string;
  }>({ isOpen: false });

  // Inputs for top priorities and secondary tasks
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newSecondaryTitle, setNewSecondaryTitle] = useState('');

  // Reload active plan from DB
  const loadPlan = useCallback(() => {
    const plan = db.getDailyPlan(selectedDate);
    setCurrentPlan(plan);
    setAllPlans(db.getDailyPlansRange('2026-01-01', '2026-12-31'));
  }, [selectedDate]);

  useEffect(() => {
    loadPlan();
    const unsubscribe = db.subscribeData(() => {
      loadPlan();
    });
    return unsubscribe;
  }, [loadPlan]);

  const activities = useMemo(() => currentPlan?.activities || [], [currentPlan]);
  const topPriorities = useMemo(() => currentPlan?.topPriorities || [], [currentPlan]);
  const secondaryTasks = useMemo(() => currentPlan?.secondaryTasks || [], [currentPlan]);

  // Aggregated daily metrics
  const metrics = useMemo(() => calculateDailyMetrics(activities), [activities]);

  // Check for conflicts across current activities
  const hasAnyConflict = useMemo(() => {
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a = activities[i];
        const b = activities[j];
        const conf = detectConflicts(a.startTime, a.endTime, [b]);
        if (conf.hasConflict) return true;
      }
    }
    return false;
  }, [activities]);

  // Activity Handlers
  const handleOpenAddModal = (timeStr = '09:00') => {
    setSelectedActivityToEdit(null);
    setInitialTimeForModal(timeStr);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (act: PlannerActivity) => {
    setSelectedActivityToEdit(act);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (activity: PlannerActivity) => {
    db.saveActivity(activity);
    loadPlan();
  };

  const handleDeleteActivityConfirm = () => {
    if (deleteConfirmState.activityId) {
      db.deleteActivity(selectedDate, deleteConfirmState.activityId);
      setDeleteConfirmState({ isOpen: false });
      loadPlan();
    }
  };

  const handleToggleActivityComplete = (act: PlannerActivity) => {
    const updatedStatus: ActivityStatus = act.status === 'completed' ? 'scheduled' : 'completed';
    const updated: PlannerActivity = { ...act, status: updatedStatus };
    db.saveActivity(updated);
    loadPlan();
  };

  // Add 15m buffer right after activity
  const handleAddBuffer = (afterActivity: PlannerActivity) => {
    const currentUserId = db.getCurrentUserId();
    const [h, m] = afterActivity.endTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = (startMins + 15) % 1440;

    const startStr = afterActivity.endTime;
    const endStr = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;

    const bufferActivity: PlannerActivity = {
      id: `buffer_${Date.now()}`,
      userId: currentUserId,
      date: selectedDate,
      title: 'Rest & Cognitive Reset',
      category: 'break',
      startTime: startStr,
      endTime: endStr,
      durationMinutes: 15,
      priority: 'medium',
      status: 'scheduled',
      notes: 'Hydrate, stretch, step away from screens',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveActivity(bufferActivity);
    loadPlan();
  };

  // Smart Assistant Application
  const handleApplyAssistantPlan = (newActivities: PlannerActivity[]) => {
    const currentUserId = db.getCurrentUserId();
    const updatedPlan: DailyPlan = {
      id: currentPlan?.id || `plan_${currentUserId}_${selectedDate}`,
      userId: currentUserId,
      date: selectedDate,
      title: `Schedule for ${selectedDate}`,
      topPriorities: currentPlan?.topPriorities || [
        {
          id: `pri_${Date.now()}_1`,
          title: 'Complete Core Deep Work Block 1',
          priority: 'critical',
          completed: false,
        },
        {
          id: `pri_${Date.now()}_2`,
          title: 'Solve Applied Practice Exercises',
          priority: 'high',
          completed: false,
        },
        {
          id: `pri_${Date.now()}_3`,
          title: 'Review & Consolidate Concepts',
          priority: 'medium',
          completed: false,
        },
      ],
      secondaryTasks: currentPlan?.secondaryTasks || [
        { id: `sec_1`, title: 'Prepare workspace and water bottle', completed: false },
        { id: `sec_2`, title: 'Review lecture notes before starting', completed: false },
      ],
      activities: newActivities,
      status: 'planned',
      createdAt: currentPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveDailyPlan(updatedPlan);
    loadPlan();
  };

  // Top Priorities Handlers
  const handleAddTopPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityTitle.trim() || topPriorities.length >= 3) return;

    const currentUserId = db.getCurrentUserId();
    const newPri: TopPriority = {
      id: `pri_${Date.now()}`,
      title: newPriorityTitle.trim(),
      priority: topPriorities.length === 0 ? 'critical' : topPriorities.length === 1 ? 'high' : 'medium',
      completed: false,
    };

    const updatedPlan: DailyPlan = {
      id: currentPlan?.id || `plan_${currentUserId}_${selectedDate}`,
      userId: currentUserId,
      date: selectedDate,
      topPriorities: [...topPriorities, newPri],
      secondaryTasks,
      activities,
      status: currentPlan?.status || 'planned',
      createdAt: currentPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveDailyPlan(updatedPlan);
    setNewPriorityTitle('');
    loadPlan();
  };

  const handleTogglePriority = (priId: string) => {
    if (!currentPlan) return;
    const updated = currentPlan.topPriorities.map(p =>
      p.id === priId ? { ...p, completed: !p.completed } : p
    );
    db.saveDailyPlan({ ...currentPlan, topPriorities: updated });
    loadPlan();
  };

  const handleDeletePriority = (priId: string) => {
    if (!currentPlan) return;
    const updated = currentPlan.topPriorities.filter(p => p.id !== priId);
    db.saveDailyPlan({ ...currentPlan, topPriorities: updated });
    loadPlan();
  };

  // Secondary Tasks Handlers
  const handleAddSecondaryTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecondaryTitle.trim()) return;

    const currentUserId = db.getCurrentUserId();
    const newTask: SecondaryTask = {
      id: `sec_${Date.now()}`,
      title: newSecondaryTitle.trim(),
      completed: false,
    };

    const updatedPlan: DailyPlan = {
      id: currentPlan?.id || `plan_${currentUserId}_${selectedDate}`,
      userId: currentUserId,
      date: selectedDate,
      topPriorities,
      secondaryTasks: [...secondaryTasks, newTask],
      activities,
      status: currentPlan?.status || 'planned',
      createdAt: currentPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveDailyPlan(updatedPlan);
    setNewSecondaryTitle('');
    loadPlan();
  };

  const handleToggleSecondaryTask = (taskId: string) => {
    if (!currentPlan) return;
    const updated = currentPlan.secondaryTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    db.saveDailyPlan({ ...currentPlan, secondaryTasks: updated });
    loadPlan();
  };

  const handleDeleteSecondaryTask = (taskId: string) => {
    if (!currentPlan) return;
    const updated = currentPlan.secondaryTasks.filter(t => t.id !== taskId);
    db.saveDailyPlan({ ...currentPlan, secondaryTasks: updated });
    loadPlan();
  };

  // Quick Date Navigation
  const todayStr = getTodayDateStr();
  const tomorrowStr = getTomorrowDateStr();

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* SECTION 1: HEADER & MOTIVATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E5E5DF] dark:border-[#26282B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
              Design Your Tomorrow
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-300">
              Planner
            </span>
          </div>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0] mt-1">
            "Don't wake up wondering what to do. Wake up knowing exactly what needs to be done."
          </p>
        </div>

        {/* Global Planner Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAssistantModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2D5A46]/10 hover:bg-[#2D5A46]/20 text-[#2D5A46] dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 border border-[#2D5A46]/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Assistant</span>
          </button>

          <button
            onClick={() => setIsBriefingModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAFAF8] dark:bg-[#1E2024] hover:bg-[#F0EFEA] dark:hover:bg-[#282A30] text-[#1C1D1F] dark:text-[#FBFBF9] border border-[#E5E5DF] dark:border-[#26282B] transition-colors flex items-center gap-1.5"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Morning Briefing</span>
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAFAF8] dark:bg-[#1E2024] hover:bg-[#F0EFEA] dark:hover:bg-[#282A30] text-[#1C1D1F] dark:text-[#FBFBF9] border border-[#E5E5DF] dark:border-[#26282B] transition-colors flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
            <span>Daily Review</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('09:00')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2D5A46] hover:bg-[#234737] text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: DATE SELECTOR & VIEW MODE CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
        {/* Quick Date Tabs & Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5F5F0] dark:bg-[#1F2125] p-1 rounded-xl border border-[#E5E5DF] dark:border-[#2B2D33]">
            <button
              onClick={() => setSelectedDate(addDays(todayStr, -1))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDate === addDays(todayStr, -1)
                  ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs'
                  : 'text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDate === todayStr
                  ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs'
                  : 'text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDate === tomorrowStr
                  ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs font-semibold'
                  : 'text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Stepper Arrow Navigation */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-1.5 rounded-lg border border-[#E5E5DF] dark:border-[#26282B] text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold font-mono px-2 py-1 text-[#1C1D1F] dark:text-[#FBFBF9]">
              {formatDisplayDate(selectedDate)}
            </span>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1.5 rounded-lg border border-[#E5E5DF] dark:border-[#26282B] text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-[#F5F5F0] dark:bg-[#1F2125] p-1 rounded-xl border border-[#E5E5DF] dark:border-[#2B2D33] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs font-semibold'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            Day Timeline
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs font-semibold'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-[#FBFBF9] shadow-2xs font-semibold'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* SECTION 3: DAILY OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Planned Activities */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
              Activities
            </span>
            <ListTodo className="w-3.5 h-3.5 text-[#717376] dark:text-[#9A9CA0]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1C1D1F] dark:text-[#FBFBF9] mt-1">
            {metrics.totalActivities}
          </div>
          <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] mt-0.5">
            {metrics.completedActivities} completed ({metrics.completionRate}%)
          </div>
        </div>

        {/* Planned Study Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
              Study Target
            </span>
            <BookOpen className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#2D5A46] dark:text-emerald-400 mt-1">
            {formatMinutes(metrics.totalStudyMinutes)}
          </div>
          <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] mt-0.5">
            {metrics.plannedStudySessionsCount} study {metrics.plannedStudySessionsCount === 1 ? 'session' : 'sessions'}
          </div>
        </div>

        {/* Scheduled vs Unallocated */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
              Scheduled Time
            </span>
            <Clock className="w-3.5 h-3.5 text-[#717376] dark:text-[#9A9CA0]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1C1D1F] dark:text-[#FBFBF9] mt-1">
            {formatMinutes(metrics.totalScheduledMinutes)}
          </div>
          <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] mt-0.5">
            {formatMinutes(metrics.unallocatedMinutes)} unallocated
          </div>
        </div>

        {/* Break & Recovery Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
              Break / Meals
            </span>
            <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
            {formatMinutes(metrics.totalBreakMinutes)}
          </div>
          <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] mt-0.5">
            Restorative buffers
          </div>
        </div>

        {/* Execution Adherence */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
              Day Status
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9] mt-1 capitalize">
            {currentPlan?.status || 'Planning'}
          </div>
          <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] mt-0.5">
            {currentPlan?.dailyReview ? 'Reviewed' : 'Awaiting execution'}
          </div>
        </div>
      </div>

      {/* SECTION 4: MAIN SPLIT VIEW (TIMELINE + PRIORITIES PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Timelines */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'day' && (
            <TimelineDayView
              date={selectedDate}
              activities={activities}
              onStartPlannedSession={onStartPlannedSession}
              onEditActivity={handleEditActivity}
              onDeleteActivity={id => {
                const act = activities.find(a => a.id === id);
                setDeleteConfirmState({
                  isOpen: true,
                  activityId: id,
                  title: act?.title || 'Activity',
                });
              }}
              onToggleComplete={handleToggleActivityComplete}
              onAddAtTime={handleOpenAddModal}
              onAddBuffer={handleAddBuffer}
            />
          )}

          {viewMode === 'week' && (
            <TimelineWeekView
              currentDate={selectedDate}
              allPlans={allPlans}
              onSelectDate={d => {
                setSelectedDate(d);
                setViewMode('day');
              }}
              onAddActivityForDate={d => {
                setSelectedDate(d);
                handleOpenAddModal('09:00');
              }}
            />
          )}

          {viewMode === 'month' && (
            <TimelineMonthView
              currentDate={selectedDate}
              allPlans={allPlans}
              onSelectDate={d => {
                setSelectedDate(d);
                setViewMode('day');
              }}
            />
          )}
        </div>

        {/* Right 1/3: Top 3 Priorities & Secondary Tasks Panel */}
        <div className="space-y-5">
          {/* Top 3 Non-Negotiable Outcomes */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9] uppercase tracking-wider">
                  Top 3 Non-Negotiables
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {topPriorities.length}/3 Defined
              </span>
            </div>

            <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0] leading-relaxed">
              If you only accomplish these three today, your day is a definitive victory.
            </p>

            {/* List of top priorities */}
            <div className="space-y-2">
              {topPriorities.map((pri, idx) => (
                <div
                  key={pri.id}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                    pri.completed
                      ? 'bg-[#F7F7F4] dark:bg-[#18191B] border-[#EAEAE4] dark:border-[#26282B] opacity-75'
                      : 'bg-[#FAFAF8] dark:bg-[#1A1C1F] border-[#E5E5DF] dark:border-[#26282B]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePriority(pri.id)}
                      className="mt-0.5 text-[#717376] hover:text-[#2D5A46] shrink-0"
                    >
                      {pri.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#8A8C90] flex items-center justify-center text-[9px] font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${pri.completed ? 'line-through text-[#8A8C90]' : 'text-[#1C1D1F] dark:text-[#FBFBF9]'}`}>
                        {pri.title}
                      </p>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400 block mt-0.5">
                        {pri.priority} priority
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePriority(pri.id)}
                    className="p-1 text-[#717376] hover:text-red-500 rounded transition-colors shrink-0"
                    aria-label={`Delete priority ${pri.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Priority input if < 3 */}
              {topPriorities.length < 3 && (
                <form onSubmit={handleAddTopPriority} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPriorityTitle}
                    onChange={e => setNewPriorityTitle(e.target.value)}
                    placeholder={`Priority #${topPriorities.length + 1} outcome...`}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-[#FAFAF8] dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#2D5A46] hover:bg-[#234737] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Secondary Tasks Checklist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151619] border border-[#E5E5DF] dark:border-[#26282B] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#717376] dark:text-[#9A9CA0]" />
                <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9] uppercase tracking-wider">
                  Secondary Tasks
                </h3>
              </div>
              <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0]">
                {secondaryTasks.filter(t => t.completed).length}/{secondaryTasks.length} Done
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {secondaryTasks.map(t => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg hover:bg-[#FAFAF8] dark:hover:bg-[#1C1E21] flex items-center justify-between text-xs transition-colors"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => handleToggleSecondaryTask(t.id)}
                      className="rounded border-[#D5D5CD] text-[#2D5A46] focus:ring-[#2D5A46]"
                    />
                    <span className={`truncate ${t.completed ? 'line-through text-[#8A8C90]' : 'text-[#1C1D1F] dark:text-[#FBFBF9]'}`}>
                      {t.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteSecondaryTask(t.id)}
                    className="p-1 text-[#717376] hover:text-red-500 rounded transition-colors shrink-0"
                    aria-label={`Delete task ${t.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddSecondaryTask} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newSecondaryTitle}
                  onChange={e => setNewSecondaryTitle(e.target.value)}
                  placeholder="Quick task (e.g. Email prof, buy index cards)..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-[#FAFAF8] dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#EAEAE4] dark:bg-[#232528] hover:bg-[#DCDCD4] text-[#1C1D1F] dark:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Mindset Philosophy Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2D5A46]/10 to-teal-900/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-[#2D5A46]/20 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#2D5A46] dark:text-emerald-400 font-bold block">
              FocusFlow Philosophy
            </span>
            <p className="text-xs text-[#1C1D1F] dark:text-[#FBFBF9] font-medium leading-relaxed">
              <strong>Prepare your environment and mind</strong> → <strong>Enter deep focus</strong> → <strong>Preserve your progress and reflect</strong>.
            </p>
            <p className="text-[11px] text-[#505255] dark:text-[#A0A2A5] leading-relaxed">
              Planning your tomorrow the evening before eliminates morning decision fatigue.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: Activity Add / Edit Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        activity={selectedActivityToEdit}
        initialDate={selectedDate}
        initialStartTime={initialTimeForModal}
        existingActivities={activities}
        onSave={handleSaveActivity}
        onClose={() => setIsActivityModalOpen(false)}
      />

      {/* MODAL 2: Smart Schedule Assistant Modal */}
      <SmartScheduleAssistantModal
        isOpen={isAssistantModalOpen}
        targetDate={selectedDate}
        onApplyPlan={handleApplyAssistantPlan}
        onClose={() => setIsAssistantModalOpen(false)}
      />

      {/* MODAL 3: Morning Briefing Modal */}
      <MorningBriefingModal
        isOpen={isBriefingModalOpen}
        plan={currentPlan}
        onStartPlannedSession={onStartPlannedSession}
        onClose={() => setIsBriefingModalOpen(false)}
      />

      {/* MODAL 4: Daily Review Modal */}
      <DailyReviewModal
        isOpen={isReviewModalOpen}
        plan={currentPlan}
        targetDate={selectedDate}
        onSaveReview={rev => {
          db.saveDailyReview(selectedDate, rev);
          loadPlan();
        }}
        onClose={() => setIsReviewModalOpen(false)}
      />

      {/* Confirm Deletion Dialog (Strict zero window.confirm) */}
      <ConfirmDialog
        isOpen={deleteConfirmState.isOpen}
        title="Delete Scheduled Activity"
        description={`Are you sure you want to remove "${deleteConfirmState.title}" from your schedule? This action cannot be undone.`}
        confirmLabel="Delete Activity"
        isDestructive={true}
        onConfirm={handleDeleteActivityConfirm}
        onClose={() => setDeleteConfirmState({ isOpen: false })}
      />
    </div>
  );
};
