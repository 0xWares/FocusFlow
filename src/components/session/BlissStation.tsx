/**
 * Bliss Station — Distraction-Free Active Deep Work Study Environment.
 * Displays high-focus timer, active targets, ambient noise controller,
 * cycle progression, and graceful transition to Phase 3: Preservation.
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Circle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Coffee,
  Brain,
  Keyboard,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { formatTimerSeconds, formatDuration } from '../../utils/sessionMath';

export const BlissStation: React.FC = () => {
  const {
    sessionDraft,
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipToBreak,
    skipToFocus,
    toggleTargetCompleted,
    endSessionToPreservation,
    ambientSound,
    setAmbientSound,
  } = useSession();

  const { currentUser } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard shortcuts (Space to toggle, F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.status === 'running') {
          pauseTimer();
        } else {
          resumeTimer();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.status]);

  const isRunning = timer.status === 'running';
  const isFocus = timer.timerPhase === 'focus';

  // Calculate circular progress percentage
  const totalTarget = isFocus ? timer.targetFocusSeconds : timer.targetBreakSeconds;
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.max(0, ((totalTarget - timer.remainingSeconds) / totalTarget) * 100)) : 0;

  const targets = sessionDraft?.targets || [];
  const completedTargetsCount = targets.filter(t => t.completed).length;

  return (
    <div
      className={`min-h-[82vh] flex flex-col justify-between p-4 md:p-8 transition-colors ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#FBFBF9] dark:bg-[#101113] overflow-y-auto'
          : 'bg-[#FDFDFB] dark:bg-[#141517] border border-[#E5E5DF] dark:border-[#26282B] rounded-3xl'
      }`}
    >
      {/* Top Status & Distraction-Free Controls */}
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
        {/* Session context */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span className="font-medium text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider text-[10px]">
              Bliss Station Active
            </span>
            <span aria-hidden="true">·</span>
            <span>{sessionDraft?.subject || 'Focus Block'}</span>
            {sessionDraft?.timeBlockType === 'pomodoro' && (
              <>
                <span aria-hidden="true">·</span>
                <span>Cycle {timer.currentCycle} of {timer.totalCycles}</span>
              </>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9] truncate mt-0.5">
            {sessionDraft?.title || 'Deep Work Session'}
          </h2>
        </div>

        {/* Ambient audio & Fullscreen toggles */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Ambient noise menu */}
          <div className="relative flex items-center bg-[#F0F0EB] dark:bg-[#202225] rounded-xl p-1 text-xs">
            {(['none', 'rain', 'stream', 'white-noise'] as const).map(type => (
              <button
                key={type}
                onClick={() => setAmbientSound(type)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                  ambientSound === type
                    ? 'bg-white dark:bg-[#2D5A46] text-[#1C1D1F] dark:text-white shadow-xs'
                    : 'text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F]'
                }`}
                title={`Ambient ${type}`}
              >
                {type === 'none' ? 'Mute' : type.replace('-', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Dial / Timer Area */}
      <div className="my-auto py-8 text-center space-y-6 max-w-xl mx-auto w-full">
        {/* Phase Pill Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAEAE4] dark:bg-[#202225] text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
          {isFocus ? (
            <>
              <Brain className="w-3.5 h-3.5 text-[#2D5A46] dark:text-[#4E9473]" />
              <span>Deep Focus State</span>
            </>
          ) : (
            <>
              <Coffee className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Recovery & Rest Interval</span>
            </>
          )}
        </div>

        {/* Large Circular Timer Representation */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center">
          {/* SVG Progress Arc */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            {/* Background Track */}
            <circle
              cx="120"
              cy="120"
              r="105"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-[#EBEBE6] dark:text-[#232528]"
            />
            {/* Active Progress Arc */}
            <circle
              cx="120"
              cy="120"
              r="105"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 105}
              strokeDashoffset={2 * Math.PI * 105 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                isFocus
                  ? 'text-[#2D5A46] dark:text-[#4E9473]'
                  : 'text-[#D97706] dark:text-[#E58B24]'
              }`}
            />
          </svg>

          {/* Time Digits Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="text-5xl md:text-6xl font-bold font-mono tracking-tight tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
              {formatTimerSeconds(timer.remainingSeconds)}
            </span>
            <span className="text-xs text-[#717376] dark:text-[#9A9CA0] font-mono tabular-nums">
              Elapsed: {formatTimerSeconds(isFocus ? timer.elapsedFocusSeconds : timer.elapsedBreakSeconds)}
            </span>
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            aria-label="Reset Timer"
            className="p-3 border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isRunning ? pauseTimer : resumeTimer}
            className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm shadow-md transition-all transform active:scale-95 ${
              isFocus
                ? 'bg-[#2D5A46] hover:bg-[#234737] text-white'
                : 'bg-[#D97706] hover:bg-[#B45309] text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{timer.status === 'paused' ? 'Resume Focus' : 'Start Focus'}</span>
              </>
            )}
          </button>

          {isFocus ? (
            <button
              onClick={skipToBreak}
              aria-label="Take Recovery Break"
              title="Take Recovery Break"
              className="p-3 border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
            >
              <Coffee className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={skipToFocus}
              aria-label="Return to Focus"
              title="Return to Focus"
              className="p-3 border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Study Targets & End Session Transition Bar */}
      <div className="max-w-4xl mx-auto w-full pt-6 border-t border-[#EAEAE4] dark:border-[#26282B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Interactive Targets Tracker */}
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Session Targets ({completedTargetsCount}/{targets.length})
            </span>
            <span className="text-[11px]">Click to complete as you work</span>
          </div>

          {targets.length === 0 ? (
            <p className="text-xs text-[#717376] dark:text-[#9A9CA0] italic">
              No specific target checklist defined for this session.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
              {targets.map(target => (
                <button
                  key={target.id}
                  onClick={() => toggleTargetCompleted(target.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border text-left ${
                    target.completed
                      ? 'bg-[#2D5A46]/10 border-[#2D5A46]/30 text-[#2D5A46] dark:text-[#4E9473]'
                      : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2E3136] text-[#1C1D1F] dark:text-[#E8E8E6]'
                  }`}
                >
                  {target.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#A0A2A5] shrink-0" />
                  )}
                  <span className={target.completed ? 'line-through opacity-80' : ''}>
                    {target.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End Session -> Phase 3 CTA */}
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="p-2 text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white rounded-lg hidden sm:block"
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={endSessionToPreservation}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1D1F] hover:bg-black text-white dark:bg-white dark:text-[#121314] dark:hover:bg-[#EAEAE4] text-xs font-semibold rounded-xl shadow-xs transition-all whitespace-nowrap"
          >
            <span>Finish & Preserve Progress</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay Modal */}
      {showKeyboardShortcuts && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div
            className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 max-w-sm w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#505255] dark:text-[#A0A2A5]">Pause / Resume Timer</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[11px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#505255] dark:text-[#A0A2A5]">Toggle Fullscreen</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[11px]">F</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              className="w-full py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
