import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { PlannerActivity, DailyPlan } from '../../types';
import { SCHEDULE_ARCHETYPES, ScheduleArchetype, formatMinutes } from '../../utils/planner';
import { db } from '../../services/db';

interface SmartScheduleAssistantModalProps {
  isOpen: boolean;
  targetDate: string;
  onApplyPlan: (activities: PlannerActivity[]) => void;
  onClose: () => void;
}

export const SmartScheduleAssistantModal: React.FC<SmartScheduleAssistantModalProps> = ({
  isOpen,
  targetDate,
  onApplyPlan,
  onClose,
}) => {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('balanced-deep-work');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentUserId = db.getCurrentUserId();
  const selectedArchetype =
    SCHEDULE_ARCHETYPES.find(a => a.id === selectedArchetypeId) || SCHEDULE_ARCHETYPES[0];
  const generatedPreview = selectedArchetype.generateActivities(targetDate, currentUserId);

  const handleApply = () => {
    onApplyPlan(generatedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl shadow-2xl overflow-hidden my-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-assistant-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#1C1E21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="smart-assistant-title" className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Smart Schedule Assistant
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Generate an intentional, science-backed daily routine for <span className="font-semibold">{targetDate}</span>
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

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Archetype Selector Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#505255] dark:text-[#A0A2A5]">
              Select Daily Routine Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCHEDULE_ARCHETYPES.map(arch => {
                const isSelected = selectedArchetypeId === arch.id;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetypeId(arch.id)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#2D5A46] bg-[#2D5A46]/5 dark:border-emerald-500 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-[#E5E5DF] dark:border-[#26282B] hover:border-[#D5D5CD] dark:hover:border-[#383A40] bg-white dark:bg-[#141517]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-900/40 dark:text-emerald-300">
                          {arch.badge}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />}
                      </div>
                      <h4 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9] leading-snug">
                        {arch.name}
                      </h4>
                      <p className="text-xs text-[#717376] dark:text-[#9A9CA0] mt-1 leading-relaxed">
                        {arch.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#EAEAE4] dark:border-[#26282B] flex items-center justify-between text-[11px] text-[#505255] dark:text-[#A0A2A5]">
                      <span>Study Target:</span>
                      <strong className="font-semibold text-[#2D5A46] dark:text-emerald-400">
                        {arch.studyHours}h
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated Timeline Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2D5A46] dark:text-emerald-400" />
                Schedule Preview ({generatedPreview.length} blocks)
              </span>
              <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Total Focus Time: <strong className="text-[#2D5A46] dark:text-emerald-400">{selectedArchetype.studyHours} hours</strong>
              </span>
            </div>

            <div className="border border-[#E5E5DF] dark:border-[#26282B] rounded-xl overflow-hidden divide-y divide-[#EAEAE4] dark:divide-[#26282B] bg-[#FAFAF8] dark:bg-[#151618]">
              {generatedPreview.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-[#F2F2EC] dark:hover:bg-[#1E2024] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#717376] dark:text-[#9A9CA0] w-24">
                      {item.startTime} – {item.endTime}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isStudySession
                          ? 'bg-emerald-500'
                          : item.category === 'meals'
                          ? 'bg-orange-500'
                          : item.category === 'exercise'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                        {item.title}
                      </p>
                      {item.studySessionConfig?.learningObjective && (
                        <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0] line-clamp-1">
                          {item.studySessionConfig.learningObjective}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isStudySession && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {item.studySessionConfig?.timeBlockType === 'pomodoro' ? 'Pomodoro' : 'Ultradian'}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[#717376] dark:text-[#9A9CA0]">
                      {item.durationMinutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Tip */}
          <div className="p-3.5 rounded-xl bg-[#2D5A46]/10 dark:bg-[#2D5A46]/20 border border-[#2D5A46]/20 text-xs text-[#2D5A46] dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Deep Work Principle:</strong> High-impact cognitive blocks are placed in the morning when mental energy is peaked, separated by restorative 30m buffers to avoid mid-day burnout.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#1C1E21]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#505255] hover:bg-[#F0F0EB] dark:text-[#A0A2A5] dark:hover:bg-[#202225] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D5A46] hover:bg-[#234737] shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Apply Routine to {targetDate}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
