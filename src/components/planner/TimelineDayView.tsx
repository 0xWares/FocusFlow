import React, { useMemo } from 'react';
import {
  Clock,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Plus,
  AlertTriangle,
  Sparkles,
  Coffee,
  Check,
  Target,
} from 'lucide-react';
import { PlannerActivity } from '../../types';
import {
  timeToMinutes,
  minutesToTime,
  formatMinutes,
  getCategoryMeta,
  findMissingBuffers,
  getTodayDateStr,
} from '../../utils/planner';

interface TimelineDayViewProps {
  date: string;
  activities: PlannerActivity[];
  onStartPlannedSession: (activity: PlannerActivity) => void;
  onEditActivity: (activity: PlannerActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleComplete: (activity: PlannerActivity) => void;
  onAddAtTime: (timeStr: string) => void;
  onAddBuffer: (afterActivity: PlannerActivity) => void;
}

export const TimelineDayView: React.FC<TimelineDayViewProps> = ({
  date,
  activities,
  onStartPlannedSession,
  onEditActivity,
  onDeleteActivity,
  onToggleComplete,
  onAddAtTime,
  onAddBuffer,
}) => {
  const isToday = date === getTodayDateStr();

  // Current time marker for today
  const currentMinutes = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday]);

  // Sort activities chronologically
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities]);

  // Missing buffer detections
  const bufferSuggestions = useMemo(() => {
    return findMissingBuffers(sortedActivities);
  }, [sortedActivities]);

  // Standard hours for the grid (05:00 to 23:00 highlighted, full 24h accessible)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl bg-white dark:bg-[#141517] overflow-hidden shadow-xs">
      {/* Timeline Header Bar */}
      <div className="px-5 py-3 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#18191B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9] uppercase tracking-wider">
            24-Hour Vertical Daily Timeline
          </h3>
        </div>

        <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">
          {sortedActivities.length} {sortedActivities.length === 1 ? 'block' : 'blocks'} scheduled
        </span>
      </div>

      {sortedActivities.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/40 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Schedule is empty for this date
            </h4>
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-sm mx-auto mt-1">
              "Don't wake up wondering what to do. Wake up knowing exactly what needs to be done."
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => onAddAtTime('09:00')}
              className="px-4 py-2 bg-[#2D5A46] hover:bg-[#234737] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Activity</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-4">
          {sortedActivities.map((act, index) => {
            const meta = getCategoryMeta(act.category);
            const isCompleted = act.status === 'completed';
            const missingBuffer = bufferSuggestions.find(b => b.afterActivityId === act.id);

            return (
              <React.Fragment key={act.id}>
                {/* Activity Card */}
                <div
                  className={`group relative p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'border-[#EAEAE4] bg-[#F7F7F4] dark:border-[#26282B] dark:bg-[#18191B] opacity-80'
                      : `${meta.borderLight} ${meta.bgLight} ${meta.borderDark} ${meta.bgDark} shadow-xs`
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Time badge & Info */}
                    <div className="flex items-start gap-3">
                      {/* Completion Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleComplete(act)}
                        className="mt-0.5 text-[#717376] hover:text-[#2D5A46] dark:hover:text-emerald-400 transition-colors shrink-0"
                        title={isCompleted ? 'Mark as scheduled' : 'Mark as completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/80" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#8A8C90] hover:text-[#2D5A46]" />
                        )}
                      </button>

                      <div className="space-y-1">
                        {/* Time & Category Pill */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] bg-white/70 dark:bg-black/30 px-2 py-0.5 rounded border border-[#E5E5DF]/50 dark:border-[#26282B]">
                            {act.startTime} – {act.endTime}
                          </span>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.textLight} ${meta.textDark} bg-white/80 dark:bg-black/40`}>
                            {meta.label}
                          </span>

                          <span className="text-[10px] font-mono text-[#717376] dark:text-[#9A9CA0]">
                            {formatMinutes(act.durationMinutes)}
                          </span>

                          {act.priority === 'critical' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                              Critical
                            </span>
                          )}
                          {act.priority === 'high' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              High
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-[#717376] dark:text-[#9A9CA0]' : 'text-[#1C1D1F] dark:text-[#FBFBF9]'}`}>
                          {act.title}
                        </h4>

                        {act.studySessionConfig?.learningObjective && (
                          <p className="text-xs text-[#505255] dark:text-[#A0A2A5]">
                            <span className="font-semibold text-[#2D5A46] dark:text-emerald-400">Target:</span>{' '}
                            {act.studySessionConfig.learningObjective}
                          </p>
                        )}

                        {act.notes && (
                          <p className="text-xs italic text-[#717376] dark:text-[#9A9CA0]">
                            Note: {act.notes}
                          </p>
                        )}

                        {/* Micro-targets list if configured */}
                        {act.studySessionConfig?.targets && act.studySessionConfig.targets.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-1.5">
                            {act.studySessionConfig.targets.map((tgt, tidx) => (
                              <span
                                key={tidx}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/30 border border-[#E5E5DF]/50 dark:border-[#26282B] text-[#505255] dark:text-[#A0A2A5]"
                              >
                                <Target className="w-3 h-3 text-[#2D5A46] dark:text-emerald-400" />
                                <span>{tgt.title}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* Direct Start Planned Session CTA */}
                      {act.isStudySession && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onStartPlannedSession(act)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D5A46] hover:bg-[#234737] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
                          title="Launch active study session with pre-configured timer and targets"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Session</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditActivity(act)}
                        className="p-1.5 rounded-lg text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        aria-label={`Edit ${act.title}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteActivity(act.id)}
                        className="p-1.5 rounded-lg text-[#717376] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        aria-label={`Delete ${act.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Missing Buffer Prompt */}
                {missingBuffer && (
                  <div className="flex items-center justify-center -my-1">
                    <button
                      type="button"
                      onClick={() => onAddBuffer(act)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-colors shadow-2xs"
                    >
                      <Coffee className="w-3 h-3" />
                      <span>Back-to-back blocks: Add 15m Recovery Break at {missingBuffer.suggestedTime}</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Quick Add Hour Bar at Bottom */}
      <div className="p-3 border-t border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#18191B] flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[#717376] dark:text-[#9A9CA0]">
          Quick insert time slot:
        </span>
        <div className="flex flex-wrap gap-1">
          {['08:00', '10:00', '12:00', '14:00', '16:00', '19:00', '21:00'].map(t => (
            <button
              key={t}
              onClick={() => onAddAtTime(t)}
              className="px-2 py-1 rounded bg-[#EAEAE4] dark:bg-[#232528] text-[#505255] dark:text-[#A0A2A5] hover:bg-[#2D5A46] hover:text-white dark:hover:bg-[#2D5A46] transition-colors font-mono text-[11px]"
            >
              +{t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
