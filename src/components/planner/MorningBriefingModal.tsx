import React from 'react';
import {
  X,
  Sun,
  Target,
  Play,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { DailyPlan, PlannerActivity } from '../../types';
import { formatMinutes } from '../../utils/planner';

interface MorningBriefingModalProps {
  isOpen: boolean;
  plan?: DailyPlan | null;
  onStartPlannedSession: (activity: PlannerActivity) => void;
  onClose: () => void;
}

export const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({
  isOpen,
  plan,
  onStartPlannedSession,
  onClose,
}) => {
  if (!isOpen) return null;

  const activities = plan?.activities || [];
  const topPriorities = plan?.topPriorities || [];
  const firstStudySession = activities.find(a => a.isStudySession && a.status !== 'completed');
  const firstActivity = activities[0];

  const totalStudyMins = activities
    .filter(a => a.isStudySession || ['study', 'revision', 'learning'].includes(a.category))
    .reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-xl bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl shadow-2xl overflow-hidden my-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="morning-briefing-title"
      >
        {/* Banner with morning sun motif */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500/10 via-emerald-600/10 to-teal-700/10 dark:from-amber-500/20 dark:via-emerald-950/40 dark:to-teal-950/40 border-b border-[#EAEAE4] dark:border-[#26282B]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Sun className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold block">
                  Morning Briefing
                </span>
                <h2 id="morning-briefing-title" className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Rise & Focus
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white transition-colors"
              aria-label="Close morning briefing"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-4 text-xs italic text-[#505255] dark:text-[#A0A2A5] leading-relaxed border-l-2 border-amber-500 pl-3">
            "Don't wake up wondering what to do. Wake up knowing exactly what needs to be done. Today's execution builds tomorrow's mastery."
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Day Metrics Quick Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F6F6F2] dark:bg-[#202226] border border-[#E6E6DF] dark:border-[#2C2E33] text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#717376] dark:text-[#9A9CA0] block">
                Activities
              </span>
              <strong className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                {activities.length}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#717376] dark:text-[#9A9CA0] block">
                Planned Study
              </span>
              <strong className="text-base font-bold text-[#2D5A46] dark:text-emerald-400">
                {formatMinutes(totalStudyMins)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#717376] dark:text-[#9A9CA0] block">
                Top Priorities
              </span>
              <strong className="text-base font-bold text-amber-700 dark:text-amber-400">
                {topPriorities.length}
              </strong>
            </div>
          </div>

          {/* Top 3 Non-Negotiable Priorities */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#717376] dark:text-[#9A9CA0] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
              Non-Negotiable Outcomes for Today
            </h3>

            {topPriorities.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#D5D5CD] dark:border-[#32353A] text-center text-xs text-[#717376] dark:text-[#9A9CA0]">
                No top priorities defined yet for today. Use the planner side panel to set your top 3!
              </div>
            ) : (
              <div className="space-y-1.5">
                {topPriorities.map((pri, idx) => (
                  <div
                    key={pri.id}
                    className="p-3 rounded-xl border border-[#E5E5DF] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#161719] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className={`font-semibold ${pri.completed ? 'line-through text-[#8A8C90]' : 'text-[#1C1D1F] dark:text-[#FBFBF9]'}`}>
                        {pri.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {pri.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Up Session */}
          {firstStudySession && (
            <div className="p-4 rounded-xl border border-[#2D5A46]/30 bg-[#2D5A46]/5 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#2D5A46] dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Upcoming Focus Block
                </span>
                <span className="text-[11px] font-mono text-[#717376] dark:text-[#9A9CA0]">
                  {firstStudySession.startTime} – {firstStudySession.endTime}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  {firstStudySession.title}
                </h4>
                {firstStudySession.studySessionConfig?.learningObjective && (
                  <p className="text-xs text-[#505255] dark:text-[#A0A2A5] mt-1">
                    {firstStudySession.studySessionConfig.learningObjective}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onStartPlannedSession(firstStudySession);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#2D5A46] hover:bg-[#234737] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start This Session Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#1C1E21] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#1C1D1F] hover:bg-[#323438] dark:bg-[#2C2E33] dark:hover:bg-[#3A3D42] transition-colors"
          >
            I'm Ready to Execute
          </button>
        </div>
      </div>
    </div>
  );
};
