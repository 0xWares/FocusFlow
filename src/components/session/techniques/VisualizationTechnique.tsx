/**
 * Technique 4: Visualization.
 * Mental rehearsal of mastery, target completion, and post-session satisfaction.
 */

import React, { useState, useEffect } from 'react';
import { Eye, Check, Volume2, VolumeX, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';

interface VisualizationTechniqueProps {
  onComplete: () => void;
}

const VISUALIZATION_STEPS = [
  {
    step: 1,
    title: 'Physical Grounding',
    instruction: 'Gently close your eyes. Relax your jaw, drop your shoulders, and rest your hands lightly on your desk or lap.',
  },
  {
    step: 2,
    title: 'Slow Conscious Breath',
    instruction: 'Take a slow, deep breath in through the nose for 4 seconds... pause briefly... and release any tension with a long, soft exhale.',
  },
  {
    step: 3,
    title: 'Visualizing Deep Engagement',
    instruction: 'Picture yourself looking at your study material with calm curiosity. See yourself absorbing the ideas without rush or friction.',
  },
  {
    step: 4,
    title: 'Navigating Difficulty',
    instruction: 'Imagine encountering a challenging problem or concept. See yourself staying patient, analyzing it step-by-step, and breaking through.',
  },
  {
    step: 5,
    title: 'The Feeling of Completion',
    instruction: 'Visualize closing your laptop or notebook at the end of this session. Feel the profound inner satisfaction of honest, uninterrupted effort.',
  },
  {
    step: 6,
    title: 'Ready for Flow',
    instruction: 'Open your eyes gently. Your mind is aligned with your intention. You are fully prepared to enter your Bliss Station.',
  },
];

export const VisualizationTechnique: React.FC<VisualizationTechniqueProps> = ({ onComplete }) => {
  const { ambientSound, setAmbientSound } = useSession();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const cur = VISUALIZATION_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < VISUALIZATION_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-10 max-w-2xl mx-auto space-y-8 shadow-xs">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center mx-auto">
          <Eye className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
          Guided Mental Visualization
        </h3>
        <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-md mx-auto">
          Rehearse the exact mental state and satisfaction of successfully accomplishing your study target.
        </p>
      </div>

      {/* Audio Ambience quick toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F5F5F0] dark:bg-[#151618] rounded-xl text-xs border border-[#EAEAE4] dark:border-[#24262A]">
        <div className="flex items-center gap-2 text-[#505255] dark:text-[#A0A2A5]">
          <Volume2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
          <span>Calming Background Ambience:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['none', 'rain', 'stream'] as const).map(type => (
            <button
              key={type}
              onClick={() => setAmbientSound(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                ambientSound === type
                  ? 'bg-[#2D5A46] text-white shadow-xs'
                  : 'bg-white dark:bg-[#202225] text-[#505255] dark:text-[#A0A2A5] hover:bg-gray-100'
              }`}
            >
              {type === 'none' ? 'Mute' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Guided Step Card */}
      <div className="bg-[#FAF8F5] dark:bg-[#131416] border border-[#EAE6DF] dark:border-[#232529] rounded-2xl p-8 text-center space-y-4 min-h-[220px] flex flex-col justify-center">
        <div className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
          Step {cur.step} of {VISUALIZATION_STEPS.length} · {cur.title}
        </div>

        <p className="text-base md:text-lg text-[#1C1D1F] dark:text-[#FBFBF9] leading-relaxed max-w-lg mx-auto">
          "{cur.instruction}"
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {VISUALIZATION_STEPS.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => setCurrentStepIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentStepIndex
                ? 'w-8 bg-[#2D5A46] dark:bg-[#4E9473]'
                : 'w-2 bg-[#D8D8D0] dark:bg-[#2C2F33]'
            }`}
            aria-label={`Go to step ${s.step}`}
          />
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-xs font-medium text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5] dark:hover:text-white disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentStepIndex < VISUALIZATION_STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <span>Next Instruction</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2D5A46] hover:bg-[#234737] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Visualization Complete & Ready</span>
          </button>
        )}
      </div>
    </div>
  );
};
