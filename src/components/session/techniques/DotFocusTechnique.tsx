/**
 * Technique 1: Dot Focus.
 * Minimalist focal point training to stabilize visual and cognitive attention before deep work.
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';
import { formatTimerSeconds } from '../../../utils/sessionMath';

interface DotFocusTechniqueProps {
  onComplete: () => void;
}

export const DotFocusTechnique: React.FC<DotFocusTechniqueProps> = ({ onComplete }) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(2);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  const handleSelectDuration = (mins: number) => {
    setIsRunning(false);
    setIsFinished(false);
    setDurationMinutes(mins);
    setRemainingSeconds(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(durationMinutes * 60);
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-10 max-w-2xl mx-auto space-y-8 text-center shadow-xs">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
          Dot Focus Technique
        </h3>
        <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-md mx-auto">
          Stare directly at the central black dot. Whenever your mind wanders to random thoughts, gently bring your gaze and attention back.
        </p>
      </div>

      {/* Central Visual Focus Field */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full bg-[#F5F5F0] dark:bg-[#121314] border border-[#E5E5DF] dark:border-[#26282B] flex items-center justify-center transition-all duration-700">
        {/* Soft breathing ring */}
        <div
          className={`absolute inset-4 rounded-full border border-[#2D5A46]/20 transition-transform duration-1000 ${
            isRunning ? 'scale-105 opacity-60' : 'scale-100 opacity-20'
          }`}
        />

        {/* The Black Dot (Focal Target) */}
        <div className="w-4 h-4 rounded-full bg-[#1C1D1F] dark:bg-[#FBFBF9] shadow-xs cursor-pointer hover:scale-125 transition-transform" />
      </div>

      {/* Timer & Duration Selection */}
      <div className="space-y-4">
        <div className="text-3xl font-bold font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
          {formatTimerSeconds(remainingSeconds)}
        </div>

        {/* Preset duration buttons */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(mins => (
            <button
              key={mins}
              onClick={() => handleSelectDuration(mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                durationMinutes === mins
                  ? 'bg-[#2D5A46] text-white'
                  : 'bg-[#F0F0EB] text-[#505255] hover:bg-[#E5E5DF] dark:bg-[#202225] dark:text-[#A0A2A5]'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{remainingSeconds < durationMinutes * 60 ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            aria-label="Reset Timer"
            className="p-2.5 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instructions list */}
      <div className="text-left bg-[#F8F8F6] dark:bg-[#1E2023] p-4 rounded-xl text-xs space-y-1.5 text-[#505255] dark:text-[#A0A2A5] border border-[#EAEAE4] dark:border-[#282A2E]">
        <p className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">Practice Guidance:</p>
        <p>1. Sit upright comfortably with shoulders relaxed.</p>
        <p>2. Keep your soft gaze anchored on the center dot.</p>
        <p>3. Breathe naturally through the nose.</p>
        <p>4. When external thoughts arise, acknowledge them calmly and return to the center.</p>
      </div>

      {/* Completion Action */}
      <div className="pt-2">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D5A46] hover:bg-[#234737] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>I am Focused & Ready</span>
        </button>
      </div>
    </div>
  );
};
