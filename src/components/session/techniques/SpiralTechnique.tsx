/**
 * Technique 2: Spiral Technique.
 * Visual smooth rotation exercise to slow down racing thoughts before study sessions.
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { formatTimerSeconds } from '../../../utils/sessionMath';

interface SpiralTechniqueProps {
  onComplete: () => void;
}

export const SpiralTechnique: React.FC<SpiralTechniqueProps> = ({ onComplete }) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(2);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [rotationSpeed, setRotationSpeed] = useState<'slow' | 'medium' | 'flow'>('slow');

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
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
    setDurationMinutes(mins);
    setRemainingSeconds(mins * 60);
  };

  const getAnimationDuration = () => {
    switch (rotationSpeed) {
      case 'slow':
        return '24s';
      case 'medium':
        return '16s';
      case 'flow':
        return '10s';
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-10 max-w-2xl mx-auto space-y-8 text-center shadow-xs">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
          Spiral Technique
        </h3>
        <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-md mx-auto">
          Relax your breathing and gently trace the rotating spiral inward with your eyes to quiet mental chatter.
        </p>
      </div>

      {/* Animated Hypnotic Spiral Canvas/SVG */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full bg-[#F5F5F0] dark:bg-[#121314] border border-[#E5E5DF] dark:border-[#26282B] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 200 200"
          className="w-56 h-56 transition-all"
          style={{
            animation: isRunning ? `spin ${getAnimationDuration()} linear infinite` : 'none',
          }}
        >
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          {/* Multi-ring Archimedian spiral arms */}
          <path
            d="M 100 100
               m 0 -5
               a 5 5 0 0 1 5 5
               a 10 10 0 0 1 -10 10
               a 15 15 0 0 1 -15 -15
               a 20 20 0 0 1 20 -20
               a 25 25 0 0 1 25 25
               a 30 30 0 0 1 -30 30
               a 35 35 0 0 1 -35 -35
               a 40 40 0 0 1 40 -40
               a 45 45 0 0 1 45 45
               a 50 50 0 0 1 -50 50
               a 55 55 0 0 1 -55 -55
               a 60 60 0 0 1 60 -60
               a 65 65 0 0 1 65 65
               a 70 70 0 0 1 -70 70
               a 75 75 0 0 1 -75 -75
               a 80 80 0 0 1 80 -80
               a 85 85 0 0 1 85 85"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="text-[#2D5A46] dark:text-[#4E9473] opacity-85"
          />
          <circle cx="100" cy="100" r="3" className="fill-[#1C1D1F] dark:fill-white" />
        </svg>
      </div>

      {/* Speed & Duration controls */}
      <div className="space-y-4">
        <div className="text-3xl font-bold font-mono tabular-nums text-[#1C1D1F] dark:text-[#FBFBF9]">
          {formatTimerSeconds(remainingSeconds)}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#717376] dark:text-[#9A9CA0]">Duration:</span>
            {[1, 2, 3].map(mins => (
              <button
                key={mins}
                onClick={() => handleSelectDuration(mins)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  durationMinutes === mins
                    ? 'bg-[#2D5A46] text-white'
                    : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#717376] dark:text-[#9A9CA0]">Speed:</span>
            {(['slow', 'medium', 'flow'] as const).map(s => (
              <button
                key={s}
                onClick={() => setRotationSpeed(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  rotationSpeed === s
                    ? 'bg-[#2D5A46] text-white'
                    : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Start / Pause / Reset */}
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
                <span>{remainingSeconds < durationMinutes * 60 ? 'Resume' : 'Start Spiral'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setRemainingSeconds(durationMinutes * 60);
            }}
            aria-label="Reset Timer"
            className="p-2.5 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completion */}
      <div className="pt-2">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D5A46] hover:bg-[#234737] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>I am Centered & Ready</span>
        </button>
      </div>
    </div>
  );
};
