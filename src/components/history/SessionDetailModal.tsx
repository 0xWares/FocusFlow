/**
 * Detailed Study Session Report Modal.
 * Displays full records of Preparation, Targets, Notes, Closing, and 1-10 Ratings.
 */

import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Brain,
  Zap,
  Smile,
  BookOpen,
  Heart,
  Trash2,
  Share2,
} from 'lucide-react';
import { StudySession } from '../../types';
import { formatDuration } from '../../utils/sessionMath';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SessionDetailModalProps {
  session: StudySession;
  onClose: () => void;
  onDeleteSession: (id: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onDeleteSession,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(session.sessionDate));

  const completedTargets = session.targets?.filter(t => t.completed).length || 0;
  const totalTargets = session.targets?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EAEAE4] dark:border-[#26282B] pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#717376] dark:text-[#9A9CA0]">
              <span className="capitalize">{session.timeBlockType} Block</span>
              <span aria-hidden="true">·</span>
              <span>{session.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{dateFormatted}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9] truncate">
              {session.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white rounded-lg transition-colors"
            aria-label="Close session report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Score Badges / Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 text-center p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B]">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] uppercase">Duration</span>
            <p className="text-base font-bold font-mono text-[#1C1D1F] dark:text-[#FBFBF9] tabular-nums">
              {formatDuration(session.actualDuration)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] uppercase">Focus</span>
            <p className="text-base font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
              {session.focusRating}/10
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] uppercase">Energy</span>
            <p className="text-base font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
              {session.energyRating}/10
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#717376] dark:text-[#9A9CA0] uppercase">Satisfaction</span>
            <p className="text-base font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
              {session.satisfactionRating}/10
            </p>
          </div>
        </div>

        {/* Session Intention */}
        {session.preparation?.intention && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#717376] dark:text-[#9A9CA0]">Session Intention</span>
            <p className="text-xs italic text-[#1C1D1F] dark:text-[#E8E8E6] bg-[#F5F5F0] dark:bg-[#1E2023] p-3 rounded-xl border border-[#EAEAE4] dark:border-[#282A2E]">
              "{session.preparation.intention}"
            </p>
          </div>
        )}

        {/* Study Targets Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
            <span>Study Targets Completed</span>
            <span className="font-mono text-[#717376] dark:text-[#9A9CA0] tabular-nums">
              {completedTargets} / {totalTargets} targets
            </span>
          </div>

          <div className="space-y-1.5">
            {(session.targets || []).map(target => (
              <div
                key={target.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#1A1C1F] text-xs border border-[#EAE6DF] dark:border-[#24262A]"
              >
                {target.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#A0A2A5] shrink-0" />
                )}
                <span className={target.completed ? 'line-through text-[#717376] dark:text-[#9A9CA0]' : 'text-[#1C1D1F] dark:text-[#FBFBF9]'}>
                  {target.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Structured Session Notes */}
        {session.sessionNotes && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Preserved Knowledge & Concepts
            </span>

            {/* Concepts learned */}
            {session.sessionNotes.conceptsLearned?.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">Concepts Learned:</span>
                <div className="flex flex-wrap gap-1.5">
                  {session.sessionNotes.conceptsLearned.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Problems Solved */}
            {session.sessionNotes.problemsSolved?.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">Problems Solved:</span>
                <div className="flex flex-wrap gap-1.5">
                  {session.sessionNotes.problemsSolved.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-[#D97706]/10 text-[#D97706] text-[11px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown notes body */}
            {session.sessionNotes.markdownNotes && (
              <div className="p-3.5 rounded-xl bg-[#F8F8F6] dark:bg-[#141517] border border-[#EAEAE4] dark:border-[#24262A] text-xs font-mono whitespace-pre-wrap text-[#1C1D1F] dark:text-[#E8E8E6]">
                {session.sessionNotes.markdownNotes}
              </div>
            )}
          </div>
        )}

        {/* Reflection & Gratitude */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
          {session.closingActivities?.gratitudeReflection && (
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1A1C1F] border border-[#EAE6DF] dark:border-[#24262A] space-y-1">
              <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Gratitude Reflection
              </span>
              <p className="text-[#505255] dark:text-[#A0A2A5]">
                {session.closingActivities.gratitudeReflection}
              </p>
            </div>
          )}

          {session.reflection && (
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1A1C1F] border border-[#EAE6DF] dark:border-[#24262A] space-y-1">
              <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Improvement for Next Session
              </span>
              <p className="text-[#505255] dark:text-[#A0A2A5]">
                {session.reflection}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EAEAE4] dark:border-[#26282B]">
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2D5A46] text-white rounded-xl text-xs font-semibold hover:bg-[#254B3A]"
          >
            Close Report
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Study Session"
        description={`Are you sure you want to delete "${session.title}" (${formatDuration(session.actualDuration)})? This session record will be permanently deleted from your study history.`}
        confirmLabel="Delete Session"
        isDestructive={true}
        onConfirm={() => {
          onDeleteSession(session.id);
          onClose();
        }}
        onClose={() => setShowConfirmDelete(false)}
      />
    </div>
  );
};
