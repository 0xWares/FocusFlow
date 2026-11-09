import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ThumbsUp,
  Award,
} from 'lucide-react';
import { DailyPlan, DailyReview, StudySession } from '../../types';
import { calculatePlannedVsActual, formatMinutes } from '../../utils/planner';
import { db } from '../../services/db';

interface DailyReviewModalProps {
  isOpen: boolean;
  plan?: DailyPlan | null;
  targetDate: string;
  onSaveReview: (review: DailyReview) => void;
  onClose: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  plan,
  targetDate,
  onSaveReview,
  onClose,
}) => {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [evaluation, setEvaluation] = useState('Excellent execution');
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    setSessions(db.getSessions());
  }, [isOpen]);

  useEffect(() => {
    if (plan?.dailyReview) {
      setWhatWentWell(plan.dailyReview.whatWentWell || '');
      setWhatToImprove(plan.dailyReview.whatToImprove || '');
      setEvaluation(plan.dailyReview.evaluation || 'Excellent execution');
    } else {
      setWhatWentWell('');
      setWhatToImprove('');
      setEvaluation('Excellent execution');
    }
  }, [plan, isOpen]);

  const activities = plan?.activities || [];
  const comparison = useMemo(() => {
    return calculatePlannedVsActual(activities, sessions, targetDate);
  }, [activities, sessions, targetDate]);

  if (!isOpen) return null;

  const completedActivitiesCount = activities.filter(a => a.status === 'completed').length;
  const skippedActivitiesCount = activities.filter(a => a.status === 'skipped').length;
  const rescheduledActivitiesCount = activities.filter(a => a.status === 'rescheduled').length;
  const completionRate =
    activities.length > 0 ? Math.round((completedActivitiesCount / activities.length) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const review: DailyReview = {
      completedActivitiesCount,
      skippedActivitiesCount,
      rescheduledActivitiesCount,
      plannedStudyMinutes: comparison.plannedStudyMinutes,
      actualStudyMinutes: comparison.actualStudyMinutes,
      completionRate,
      whatWentWell: whatWentWell.trim(),
      whatToImprove: whatToImprove.trim(),
      evaluation,
      completedAt: new Date().toISOString(),
    };

    onSaveReview(review);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl shadow-2xl overflow-hidden my-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-review-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#1C1E21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 id="daily-review-title" className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                End-of-Day Review & Reflection
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Evaluate execution, celebrate wins, and adjust for <span className="font-semibold">{targetDate}</span>
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
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Planned vs Actual Comparison Metric Cards */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5] flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
              Planned vs. Actual Study Session Output
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Planned Hours */}
              <div className="p-3.5 rounded-xl bg-[#F6F6F2] dark:bg-[#202226] border border-[#E6E6DF] dark:border-[#2C2E33]">
                <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
                  Planned Study Time
                </span>
                <span className="text-lg font-bold text-[#1C1D1F] dark:text-[#FBFBF9] font-mono">
                  {formatMinutes(comparison.plannedStudyMinutes)}
                </span>
                <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] block mt-0.5">
                  Across {comparison.plannedSessionsCount} planned blocks
                </span>
              </div>

              {/* Actual Logged Hours */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                  Actual Logged Time
                </span>
                <span className="text-lg font-bold text-[#2D5A46] dark:text-emerald-400 font-mono">
                  {formatMinutes(comparison.actualStudyMinutes)}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  From {comparison.actualSessionsCount} verified sessions
                </span>
              </div>

              {/* Adherence / Variance */}
              <div className="p-3.5 rounded-xl bg-[#F6F6F2] dark:bg-[#202226] border border-[#E6E6DF] dark:border-[#2C2E33]">
                <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block">
                  Schedule Adherence
                </span>
                <span className="text-lg font-bold text-[#1C1D1F] dark:text-[#FBFBF9] font-mono">
                  {comparison.completionPercentage}%
                </span>
                <span className={`text-[10px] block mt-0.5 ${comparison.varianceMinutes >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {comparison.varianceMinutes >= 0 ? `+${comparison.varianceMinutes}m above plan` : `${Math.abs(comparison.varianceMinutes)}m under plan`}
                </span>
              </div>
            </div>
          </div>

          {/* Activities Execution Checklist Tally */}
          <div className="p-3.5 rounded-xl bg-[#FAFAF8] dark:bg-[#161719] border border-[#E5E5DF] dark:border-[#26282B] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Activity Completion: {completedActivitiesCount} of {activities.length} completed
                </span>
                <span className="text-[#717376] dark:text-[#9A9CA0] block text-[11px]">
                  {completionRate}% of all scheduled calendar blocks achieved
                </span>
              </div>
            </div>

            <div className="w-24 h-2 rounded-full bg-[#E5E5DF] dark:bg-[#2E3035] overflow-hidden">
              <div
                className="h-full bg-[#2D5A46] dark:bg-emerald-500 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Qualitative Reflections */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
                What went well today? (Wins, breakthroughs, deep focus states)
              </label>
              <textarea
                rows={2}
                value={whatWentWell}
                onChange={e => setWhatWentWell(e.target.value)}
                placeholder="e.g. Mastered the calculus chain rule, maintained zero phone distractions in session 1..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#121315] text-xs text-[#1C1D1F] dark:text-[#FBFBF9] focus:outline-hidden focus:ring-2 focus:ring-[#2D5A46]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
                What hindered your focus or needs adjustment tomorrow?
              </label>
              <textarea
                rows={2}
                value={whatToImprove}
                onChange={e => setWhatToImprove(e.target.value)}
                placeholder="e.g. Underestimated lunch duration, felt fatigued around 3 PM, need a walk buffer..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#121315] text-xs text-[#1C1D1F] dark:text-[#FBFBF9] focus:outline-hidden focus:ring-2 focus:ring-[#2D5A46]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
                Overall Daily Performance Evaluation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'Peak Flow & Mastery',
                  'Solid Execution',
                  'Moderate Progress',
                  'Off Track / Reset Tomorrow',
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEvaluation(opt)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      evaluation === opt
                        ? 'border-[#2D5A46] bg-[#2D5A46] text-white'
                        : 'border-[#D5D5CD] dark:border-[#32353A] bg-white dark:bg-[#141517] text-[#505255] dark:text-[#A0A2A5] hover:bg-[#F2F2EC] dark:hover:bg-[#1C1E21]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EAEAE4] dark:border-[#26282B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#505255] hover:bg-[#F0F0EB] dark:text-[#A0A2A5] dark:hover:bg-[#202225] transition-colors"
            >
              Close
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D5A46] hover:bg-[#234737] shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Reflection & Close Day</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
