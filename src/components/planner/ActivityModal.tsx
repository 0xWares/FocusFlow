import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Tag,
  Target as TargetIcon,
  HelpCircle,
} from 'lucide-react';
import {
  PlannerActivity,
  ActivityCategory,
  ActivityPriority,
  TimeBlockType,
  PriorityLevel,
  Goal,
} from '../../types';
import {
  calculateDurationMinutes,
  formatMinutes,
  detectConflicts,
  CATEGORY_DEFINITIONS,
  getCategoryMeta,
} from '../../utils/planner';
import { db } from '../../services/db';

interface ActivityModalProps {
  isOpen: boolean;
  activity?: PlannerActivity | null;
  initialDate: string;
  initialStartTime?: string;
  existingActivities: PlannerActivity[];
  onSave: (activity: PlannerActivity) => void;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  activity,
  initialDate,
  initialStartTime = '09:00',
  existingActivities,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('study');
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState('10:30');
  const [priority, setPriority] = useState<ActivityPriority>('high');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [notes, setNotes] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');

  // Study Session Specific Configuration
  const [isStudySession, setIsStudySession] = useState(true);
  const [subject, setSubject] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [timeBlockType, setTimeBlockType] = useState<TimeBlockType>('pomodoro');
  const [pomodoroWork, setPomodoroWork] = useState(50);
  const [pomodoroBreak, setPomodoroBreak] = useState(10);
  const [ultradianWork, setUltradianWork] = useState(90);
  const [ultradianBreak, setUltradianBreak] = useState(20);
  const [studyTargets, setStudyTargets] = useState<Array<{ title: string; priority: PriorityLevel }>>([
    { title: '', priority: 'high' },
  ]);

  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setActiveGoals(db.getGoals().filter(g => g.status === 'active'));
  }, [isOpen]);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || '');
      setDescription(activity.description || '');
      setCategory(activity.category || 'study');
      setStartTime(activity.startTime || '09:00');
      setEndTime(activity.endTime || '10:30');
      setPriority(activity.priority || 'medium');
      setRepeat(activity.repeat || 'none');
      setNotes(activity.notes || '');
      setLinkedGoalId(activity.linkedGoalId || '');
      setIsStudySession(!!activity.isStudySession || activity.category === 'study');

      if (activity.studySessionConfig) {
        setSubject(activity.studySessionConfig.subject || '');
        setLearningObjective(activity.studySessionConfig.learningObjective || '');
        setTimeBlockType(activity.studySessionConfig.timeBlockType || 'pomodoro');
        setPomodoroWork(activity.studySessionConfig.pomodoroWork || 50);
        setPomodoroBreak(activity.studySessionConfig.pomodoroBreak || 10);
        setUltradianWork(activity.studySessionConfig.ultradianWork || 90);
        setUltradianBreak(activity.studySessionConfig.ultradianBreak || 20);
        setStudyTargets(
          activity.studySessionConfig.targets?.length
            ? activity.studySessionConfig.targets
            : [{ title: '', priority: 'high' }]
        );
      } else {
        setSubject(activity.title || '');
        setLearningObjective('');
        setStudyTargets([{ title: '', priority: 'high' }]);
      }
    } else {
      // Default new activity
      setTitle('');
      setDescription('');
      setCategory('study');
      setStartTime(initialStartTime);
      // Auto-set end time 90m later
      const [h, m] = initialStartTime.split(':').map(Number);
      const endMins = (h * 60 + m + 90) % 1440;
      const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      setEndTime(`${endH}:${endM}`);
      setPriority('high');
      setRepeat('none');
      setNotes('');
      setLinkedGoalId('');
      setIsStudySession(true);
      setSubject('');
      setLearningObjective('');
      setTimeBlockType('pomodoro');
      setPomodoroWork(50);
      setPomodoroBreak(10);
      setUltradianWork(90);
      setUltradianBreak(20);
      setStudyTargets([{ title: '', priority: 'high' }]);
    }
  }, [activity, initialStartTime, isOpen]);

  // Duration in minutes
  const duration = useMemo(() => {
    return calculateDurationMinutes(startTime, endTime);
  }, [startTime, endTime]);

  // Conflict detection
  const conflict = useMemo(() => {
    return detectConflicts(startTime, endTime, existingActivities, activity?.id);
  }, [startTime, endTime, existingActivities, activity]);

  const handleAddTarget = () => {
    setStudyTargets([...studyTargets, { title: '', priority: 'medium' }]);
  };

  const handleRemoveTarget = (index: number) => {
    setStudyTargets(studyTargets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index: number, text: string) => {
    const updated = [...studyTargets];
    updated[index].title = text;
    setStudyTargets(updated);
  };

  const handleTargetPriorityChange = (index: number, pri: PriorityLevel) => {
    const updated = [...studyTargets];
    updated[index].priority = pri;
    setStudyTargets(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentUserId = db.getCurrentUserId();
    const cleanTargets = studyTargets
      .filter(t => t.title.trim().length > 0)
      .map(t => ({ title: t.title.trim(), priority: t.priority }));

    const updated: PlannerActivity = {
      id: activity ? activity.id : `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: currentUserId,
      date: initialDate,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      startTime,
      endTime,
      durationMinutes: duration,
      priority,
      status: activity ? activity.status : 'scheduled',
      repeat,
      notes: notes.trim() || undefined,
      linkedGoalId: linkedGoalId || undefined,
      isStudySession,
      studySessionConfig: isStudySession
        ? {
            subject: subject.trim() || title.trim(),
            learningObjective: learningObjective.trim() || undefined,
            targets: cleanTargets,
            timeBlockType,
            pomodoroWork,
            pomodoroBreak,
            ultradianWork,
            ultradianBreak,
          }
        : undefined,
      createdAt: activity ? activity.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  const categoryMeta = getCategoryMeta(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl shadow-2xl overflow-hidden my-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#1C1E21]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryMeta.bgLight} ${categoryMeta.bgDark} ${categoryMeta.textLight} ${categoryMeta.textDark}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="activity-modal-title" className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                {activity ? 'Edit Scheduled Activity' : 'Schedule New Activity'}
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Planning for <span className="font-semibold">{initialDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
                Activity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Linear Algebra Problem Set, Morning Cardio, Lunch"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#121315] text-[#1C1D1F] dark:text-[#FBFBF9] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2D5A46]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
                Category
              </label>
              <select
                value={category}
                onChange={e => {
                  const newCat = e.target.value as ActivityCategory;
                  setCategory(newCat);
                  if (['study', 'revision', 'learning'].includes(newCat)) {
                    setIsStudySession(true);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#121315] text-[#1C1D1F] dark:text-[#FBFBF9] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#2D5A46]"
              >
                {Object.values(CATEGORY_DEFINITIONS).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Duration Row */}
          <div className="p-4 rounded-xl bg-[#F6F6F2] dark:bg-[#202226] border border-[#E6E6DF] dark:border-[#2C2E33] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
                Time Allocation & Duration
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-300">
                Duration: {formatMinutes(duration)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <div>
                <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-sm font-mono text-[#1C1D1F] dark:text-[#FBFBF9]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-sm font-mono text-[#1C1D1F] dark:text-[#FBFBF9]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as ActivityPriority)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-sm text-[#1C1D1F] dark:text-[#FBFBF9]"
                >
                  <option value="critical">Critical (P1)</option>
                  <option value="high">High (P2)</option>
                  <option value="medium">Medium (P3)</option>
                  <option value="low">Low (P4)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                  Repeat
                </label>
                <select
                  value={repeat}
                  onChange={e => setRepeat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-sm text-[#1C1D1F] dark:text-[#FBFBF9]"
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            {/* Conflict Alert Banner */}
            {conflict.hasConflict && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Schedule Overlap:</span>{' '}
                  <span>{conflict.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Schedule as Study Session Toggle Section */}
          <div className="border border-[#E5E5DF] dark:border-[#26282B] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    Connect to Study Session Engine
                  </h3>
                  <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                    Enables direct 1-click execution into the 3-phase deep focus workflow
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStudySession}
                  onChange={e => setIsStudySession(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2D5A46]" />
              </label>
            </div>

            {isStudySession && (
              <div className="pt-2 space-y-4 border-t border-[#EAEAE4] dark:border-[#26282B] animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5]">
                      Subject / Course Name
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder={title || 'e.g. Organic Chemistry'}
                      className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5]">
                      Time Block Method
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeBlockType('pomodoro')}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          timeBlockType === 'pomodoro'
                            ? 'bg-[#2D5A46] text-white border-[#2D5A46]'
                            : 'bg-white dark:bg-[#141517] border-[#D5D5CD] dark:border-[#32353A] text-[#505255] dark:text-[#A0A2A5]'
                        }`}
                      >
                        Pomodoro (50m/10m)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeBlockType('ultradian')}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          timeBlockType === 'ultradian'
                            ? 'bg-[#2D5A46] text-white border-[#2D5A46]'
                            : 'bg-white dark:bg-[#141517] border-[#D5D5CD] dark:border-[#32353A] text-[#505255] dark:text-[#A0A2A5]'
                        }`}
                      >
                        Ultradian (90m/20m)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5]">
                    Learning Objective & Intention
                  </label>
                  <input
                    type="text"
                    value={learningObjective}
                    onChange={e => setLearningObjective(e.target.value)}
                    placeholder="What specific outcome or mastery will you achieve by the end of this block?"
                    className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9]"
                  />
                </div>

                {/* Sub-targets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5] flex items-center gap-1.5">
                      <TargetIcon className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
                      Planned Micro-Targets
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTarget}
                      className="text-[11px] font-medium text-[#2D5A46] dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Target
                    </button>
                  </div>

                  <div className="space-y-2">
                    {studyTargets.map((target, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={target.title}
                          onChange={e => handleTargetChange(idx, e.target.value)}
                          placeholder={`Target ${idx + 1} (e.g. Solve exercises 1 to 5)`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9]"
                        />
                        <select
                          value={target.priority}
                          onChange={e => handleTargetPriorityChange(idx, e.target.value as PriorityLevel)}
                          className="px-2 py-1.5 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#505255] dark:text-[#A0A2A5]"
                        >
                          <option value="high">High</option>
                          <option value="medium">Med</option>
                          <option value="low">Low</option>
                        </select>
                        {studyTargets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTarget(idx)}
                            className="p-1.5 text-[#717376] hover:text-red-500 rounded-md transition-colors"
                            aria-label={`Remove target ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goal Link & Notes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5]">
                Link to Long-Term Goal
              </label>
              <select
                value={linkedGoalId}
                onChange={e => setLinkedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9]"
              >
                <option value="">None (Independent Activity)</option>
                {activeGoals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.goalType})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#505255] dark:text-[#A0A2A5]">
                Additional Notes / Materials
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Books, room link, required files..."
                className="w-full px-3 py-2 rounded-lg border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-xs text-[#1C1D1F] dark:text-[#FBFBF9]"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EAEAE4] dark:border-[#26282B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#505255] hover:bg-[#F0F0EB] dark:text-[#A0A2A5] dark:hover:bg-[#202225] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#2D5A46] hover:bg-[#234737] shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activity ? 'Update Activity' : 'Save to Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
