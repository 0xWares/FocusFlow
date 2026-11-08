/**
 * Complete Guided Study Session Orchestrator.
 * Manages transitions through:
 * 1. Preparation Phase (5 checkpoints)
 * 2. Performance Phase (Technique calibration -> Bliss Station)
 * 3. Preservation / Closing Phase (Preserve & reflect)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  RotateCw,
  BookOpen,
  CircleDot,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { PreparationPhase } from './PreparationPhase';
import { BlissStation } from './BlissStation';
import { PreservationPhase } from './PreservationPhase';
import { DotFocusTechnique } from './techniques/DotFocusTechnique';
import { SpiralTechnique } from './techniques/SpiralTechnique';
import { DuaTechnique } from './techniques/DuaTechnique';
import { VisualizationTechnique } from './techniques/VisualizationTechnique';
import { PerformanceTechnique } from '../../types';

export const NewSessionFlow: React.FC<{ onSessionSaved: () => void }> = ({ onSessionSaved }) => {
  const {
    activePhase,
    sessionDraft,
    selectPerformanceTechnique,
    enterBlissStation,
    cancelActiveSession,
  } = useSession();

  // Selected technique in performance phase
  const [currentTechnique, setCurrentTechnique] = useState<PerformanceTechnique>('dot-focus');
  const [techniqueCompleted, setTechniqueCompleted] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // Technique selection & execution in Phase 2
  const techniques = [
    {
      id: 'dot-focus' as PerformanceTechnique,
      title: 'Dot Focus',
      description: 'Stabilize gaze and attention on a central black focal point.',
      icon: CircleDot,
    },
    {
      id: 'spiral' as PerformanceTechnique,
      title: 'Spiral Technique',
      description: 'Hypnotic visual spiral to quiet mental clutter and slow thoughts.',
      icon: RotateCw,
    },
    {
      id: 'dua' as PerformanceTechnique,
      title: 'Dua / Supplication',
      description: 'Recite contemplative prayers for clarity and beneficial knowledge.',
      icon: BookOpen,
    },
    {
      id: 'visualization' as PerformanceTechnique,
      title: 'Visualization',
      description: 'Mentally rehearse mastery, target breakthrough, and completion.',
      icon: Eye,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Phase Stepper Indicator */}
      <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`font-semibold ${
              activePhase === 'preparation'
                ? 'text-[#2D5A46] dark:text-[#4E9473]'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            1. Preparation
          </span>
          <span className="text-[#A0A2A5]">→</span>
          <span
            className={`font-semibold ${
              activePhase === 'performance'
                ? 'text-[#2D5A46] dark:text-[#4E9473]'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            2. Performance
          </span>
          <span className="text-[#A0A2A5]">→</span>
          <span
            className={`font-semibold ${
              activePhase === 'preservation'
                ? 'text-[#2D5A46] dark:text-[#4E9473]'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            3. Preservation
          </span>
        </div>

        {/* Cancel / Abandon button */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="text-xs text-[#717376] hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Cancel Session
        </button>
      </div>

      {/* PHASE 1: PREPARATION */}
      {activePhase === 'preparation' && <PreparationPhase />}

      {/* PHASE 2: PERFORMANCE */}
      {activePhase === 'performance' && (
        <>
          {!techniqueCompleted ? (
            /* Mental Technique Selection & Practice */
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Technique Selector Bar */}
              <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                    Phase 2: Performance Calibration
                  </span>
                  <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    Select Your Mental Preparation Technique
                  </h2>
                  <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                    Before entering your Bliss Station, perform at least one centering exercise to transition into deep flow.
                  </p>
                </div>

                {/* 4 Technique Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {techniques.map(tech => {
                    const Icon = tech.icon;
                    const isSelected = currentTechnique === tech.id;

                    return (
                      <div
                        key={tech.id}
                        onClick={() => {
                          setCurrentTechnique(tech.id);
                          selectPerformanceTechnique(tech.id);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'border-[#2D5A46] bg-[#2D5A46]/5 dark:border-[#4E9473] dark:bg-[#2D5A46]/10'
                            : 'border-[#E5E5DF] dark:border-[#26282B] hover:border-[#C0C0BA]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-[#2D5A46] dark:text-[#4E9473]' : 'text-[#717376]'}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#1C1D1F] dark:text-[#FBFBF9]">
                            {tech.title}
                          </h4>
                          <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0] line-clamp-2 mt-0.5">
                            {tech.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Render Selected Interactive Technique */}
              {currentTechnique === 'dot-focus' && (
                <DotFocusTechnique onComplete={() => setTechniqueCompleted(true)} />
              )}
              {currentTechnique === 'spiral' && (
                <SpiralTechnique onComplete={() => setTechniqueCompleted(true)} />
              )}
              {currentTechnique === 'dua' && (
                <DuaTechnique onComplete={() => setTechniqueCompleted(true)} />
              )}
              {currentTechnique === 'visualization' && (
                <VisualizationTechnique onComplete={() => setTechniqueCompleted(true)} />
              )}
            </div>
          ) : (
            /* "You are ready. Enter your Bliss Station." Transition Screen */
            <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-6 bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-3xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
                  You are ready.
                </h2>
                <p className="text-sm text-[#505255] dark:text-[#A0A2A5] max-w-md mx-auto">
                  Your environment is organized, your mind is calibrated, and your targets are defined.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={enterBlissStation}
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#2D5A46] hover:bg-[#204233] text-white text-base font-bold rounded-2xl shadow-md transition-all transform active:scale-95"
                >
                  <span>Enter your Bliss Station</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* If timer has started or user has entered Bliss Station */}
          {techniqueCompleted && <BlissStation />}
        </>
      )}

      {/* PHASE 3: PRESERVATION / CLOSING */}
      {activePhase === 'preservation' && (
        <PreservationPhase onSessionSaved={onSessionSaved} />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#1C1D1F] dark:text-white">
                Discard Current Session?
              </h3>
            </div>
            <p className="text-xs text-[#505255] dark:text-[#A0A2A5]">
              Are you sure you want to cancel this study session? Any uncompleted checkpoints or timer state will be discarded.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5] dark:hover:text-white"
              >
                Keep Studying
              </button>
              <button
                onClick={() => {
                  cancelActiveSession();
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
              >
                Discard Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
