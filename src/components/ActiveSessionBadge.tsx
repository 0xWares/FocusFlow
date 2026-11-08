/**
 * Active Session Floating / Pinned Widget.
 * Appears when a session is active and the user navigates away from Bliss Station.
 * Allows quick return and shows live timer progress.
 */

import React from 'react';
import { Play, Pause, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { formatTimerSeconds } from '../utils/sessionMath';

interface ActiveSessionBadgeProps {
  onReturnToSession: () => void;
}

export const ActiveSessionBadge: React.FC<ActiveSessionBadgeProps> = ({ onReturnToSession }) => {
  const { isSessionActive, activePhase, timer, pauseTimer, resumeTimer } = useSession();

  if (!isSessionActive) return null;

  const isRunning = timer.status === 'running';

  return (
    <div className="bg-[#1C1D1F] text-[#FBFBF9] dark:bg-[#202225] dark:text-white border border-[#2D5A46]/30 shadow-lg px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 rounded-full bg-[#3A7559] animate-pulse shrink-0" />
        <div className="truncate">
          <p className="font-semibold truncate">
            {activePhase === 'preparation' && 'Preparation Checkpoints'}
            {activePhase === 'performance' && (timer.timerPhase === 'focus' ? 'Deep Focus' : 'Recovery Break')}
            {activePhase === 'preservation' && 'Preservation & Closing'}
          </p>
          {activePhase === 'performance' && (
            <p className="font-mono text-[#A0A2A5] tabular-nums">
              {formatTimerSeconds(timer.remainingSeconds)} remaining
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {activePhase === 'performance' && (
          <button
            onClick={e => {
              e.stopPropagation();
              isRunning ? pauseTimer() : resumeTimer();
            }}
            aria-label={isRunning ? 'Pause Timer' : 'Resume Timer'}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        )}
        <button
          onClick={onReturnToSession}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#2D5A46] hover:bg-[#366850] text-white rounded-lg transition-colors font-medium text-[11px]"
        >
          <span>Return</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
