/**
 * Phase 3: Preservation / Closing Component.
 * Guided 4-step preservation and closure workflow:
 * Step 1: Note Keeping (concepts, problems solved, ideas, questions, notes)
 * Step 2: Organize Your Stuff (closing physical and digital checklist)
 * Step 3: Guided Transition Breathing (animated expanding/contracting breath circle)
 * Step 4: Gratitude & Performance Evaluation (1-10 Focus, Energy, Satisfaction)
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Wind,
  Heart,
  Star,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { calculateAverageScore, formatDuration } from '../../utils/sessionMath';
import { ChecklistItem } from '../../types';

export const PreservationPhase: React.FC<{ onSessionSaved: () => void }> = ({ onSessionSaved }) => {
  const { sessionDraft, updateSessionDraft, completeAndSaveSession } = useSession();

  const [activeStep, setActiveStep] = useState<number>(1);

  // Note fields
  const [newConcept, setNewConcept] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newClosingItem, setNewClosingItem] = useState('');

  // Breathing state
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathCounter, setBreathCounter] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(true);

  // Breathing 4-4-4-4 Box Breathing cycle
  useEffect(() => {
    let timer: number | null = null;
    if (isBreathingActive && activeStep === 3) {
      timer = window.setInterval(() => {
        setBreathCounter(prev => {
          if (prev <= 1) {
            setBreathingPhase(cur => {
              if (cur === 'inhale') return 'hold1';
              if (cur === 'hold1') return 'exhale';
              if (cur === 'exhale') return 'hold2';
              return 'inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingActive, activeStep]);

  if (!sessionDraft) return null;

  const notes = sessionDraft.sessionNotes || {
    summary: '',
    conceptsLearned: [],
    problemsSolved: [],
    ideasDiscovered: [],
    unfinishedTasks: [],
    questions: [],
    reminders: [],
    markdownNotes: '',
  };

  const closing = sessionDraft.closingActivities || {
    organizeChecklist: [],
    breathingCompleted: false,
    breathingDurationSeconds: 120,
    gratitudeReflection: '',
  };

  const focus = sessionDraft.focusRating || 8;
  const energy = sessionDraft.energyRating || 8;
  const satisfaction = sessionDraft.satisfactionRating || 8;
  const currentAverageScore = calculateAverageScore(focus, energy, satisfaction);

  // Closing checklist toggle
  const toggleClosingItem = (itemId: string) => {
    updateSessionDraft(prev => {
      if (!prev.closingActivities) return prev;
      const updated = prev.closingActivities.organizeChecklist.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      return {
        ...prev,
        closingActivities: {
          ...prev.closingActivities,
          organizeChecklist: updated,
        },
      };
    });
  };

  const addClosingItem = (label: string) => {
    if (!label.trim()) return;
    updateSessionDraft(prev => {
      if (!prev.closingActivities) return prev;
      const newItem: ChecklistItem = {
        id: `cl_${Date.now()}`,
        label: label.trim(),
        checked: true,
      };
      return {
        ...prev,
        closingActivities: {
          ...prev.closingActivities,
          organizeChecklist: [...prev.closingActivities.organizeChecklist, newItem],
        },
      };
    });
    setNewClosingItem('');
  };

  const removeClosingItem = (itemId: string) => {
    updateSessionDraft(prev => {
      if (!prev.closingActivities) return prev;
      return {
        ...prev,
        closingActivities: {
          ...prev.closingActivities,
          organizeChecklist: prev.closingActivities.organizeChecklist.filter(i => i.id !== itemId),
        },
      };
    });
  };

  // Add tag helper
  const addNoteTag = (field: 'conceptsLearned' | 'problemsSolved' | 'ideasDiscovered' | 'questions', value: string) => {
    if (!value.trim()) return;
    updateSessionDraft(prev => {
      const curNotes = prev.sessionNotes || notes;
      const list = curNotes[field] || [];
      return {
        ...prev,
        sessionNotes: {
          ...curNotes,
          [field]: [...list, value.trim()],
        },
      };
    });
  };

  const removeNoteTag = (field: 'conceptsLearned' | 'problemsSolved' | 'ideasDiscovered' | 'questions', index: number) => {
    updateSessionDraft(prev => {
      const curNotes = prev.sessionNotes || notes;
      const list = curNotes[field] || [];
      return {
        ...prev,
        sessionNotes: {
          ...curNotes,
          [field]: list.filter((_, i) => i !== index),
        },
      };
    });
  };

  const handleFinishSave = () => {
    const saved = completeAndSaveSession();
    if (saved) {
      onSessionSaved();
    }
  };

  const steps = [
    { num: 1, label: 'Note Keeping', icon: BookOpen },
    { num: 2, label: 'Organize Stuff', icon: CheckCircle2 },
    { num: 3, label: 'Guided Breathing', icon: Wind },
    { num: 4, label: 'Gratitude & Review', icon: Heart },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center">
          {steps.map(s => {
            const isCurrent = activeStep === s.num;
            const isCompleted = activeStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] font-semibold'
                    : isCompleted
                    ? 'text-[#505255] dark:text-[#A0A2A5] hover:bg-[#F5F5F0]'
                    : 'text-[#8E9094] dark:text-[#606368] opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#2D5A46] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-[#E5E5DF] dark:bg-[#2A2C30] text-[#1C1D1F] dark:text-white'
                      : 'border border-[#D0D0CA] dark:border-[#3A3D42]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-[#2D5A46]" /> : s.num}
                </div>
                <span className="text-[11px] truncate w-full hidden sm:block">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
        {/* STEP 1: NOTE KEEPING */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Preservation Step 1 of 4
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Preserve What You Learned
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                "What did you learn or accomplish during this session?" Capture key concepts and breakthroughs while fresh.
              </p>
            </div>

            {/* Structured Tags Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Concepts Learned */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[#EAEAE4] dark:border-[#26282B] bg-[#FAF8F5] dark:bg-[#151618]">
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Important Concepts Learned
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Inverted page table tradeoff..."
                    value={newConcept}
                    onChange={e => setNewConcept(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNoteTag('conceptsLearned', newConcept);
                        setNewConcept('');
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F] text-[#1C1D1F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addNoteTag('conceptsLearned', newConcept);
                      setNewConcept('');
                    }}
                    className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(notes.conceptsLearned || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] text-[11px]"
                    >
                      <span>{tag}</span>
                      <button onClick={() => removeNoteTag('conceptsLearned', idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Problems Solved */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[#EAEAE4] dark:border-[#26282B] bg-[#FAF8F5] dark:bg-[#151618]">
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Problems or Exercises Solved
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Fixed concurrent lock deadlock..."
                    value={newProblem}
                    onChange={e => setNewProblem(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNoteTag('problemsSolved', newProblem);
                        setNewProblem('');
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F] text-[#1C1D1F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addNoteTag('problemsSolved', newProblem);
                      setNewProblem('');
                    }}
                    className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(notes.problemsSolved || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] text-[11px]"
                    >
                      <span>{tag}</span>
                      <button onClick={() => removeNoteTag('problemsSolved', idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Ideas Discovered */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[#EAEAE4] dark:border-[#26282B] bg-[#FAF8F5] dark:bg-[#151618]">
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Ideas or Insights Discovered
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Pre-vote RPC prevents disruptive elections..."
                    value={newIdea}
                    onChange={e => setNewIdea(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNoteTag('ideasDiscovered', newIdea);
                        setNewIdea('');
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F] text-[#1C1D1F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addNoteTag('ideasDiscovered', newIdea);
                      setNewIdea('');
                    }}
                    className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(notes.ideasDiscovered || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] text-[11px]"
                    >
                      <span>{tag}</span>
                      <button onClick={() => removeNoteTag('ideasDiscovered', idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Questions for Future Study */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[#EAEAE4] dark:border-[#26282B] bg-[#FAF8F5] dark:bg-[#151618]">
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Questions for Next Session
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. How does ARM implement TLB miss handlers?..."
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNoteTag('questions', newQuestion);
                        setNewQuestion('');
                      }
                    }}
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F] text-[#1C1D1F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addNoteTag('questions', newQuestion);
                      setNewQuestion('');
                    }}
                    className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(notes.questions || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] text-[11px]"
                    >
                      <span>{tag}</span>
                      <button onClick={() => removeNoteTag('questions', idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Markdown Detailed Notes Editor */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Session Reflection & Markdown Notes
              </label>
              <textarea
                rows={4}
                value={notes.markdownNotes || ''}
                onChange={e =>
                  updateSessionDraft(prev => ({
                    ...prev,
                    sessionNotes: {
                      ...(prev.sessionNotes || notes),
                      markdownNotes: e.target.value,
                    },
                  }))
                }
                placeholder="Write structured takeaways, synthesis, formulas, or proof steps..."
                className="w-full text-xs p-3 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white font-mono"
              />
            </div>
          </div>
        )}

        {/* STEP 2: ORGANIZE YOUR STUFF */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Preservation Step 2 of 4
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Organize Your Physical & Digital Space
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Leave your desk, tabs, and mind completely clean so entering your next session requires zero friction.
              </p>
            </div>

            <div className="space-y-2.5">
              {(closing.organizeChecklist || []).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleClosingItem(item.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-[#2D5A46]/5 border-[#2D5A46]/30 text-[#1C1D1F] dark:text-[#FBFBF9]'
                      : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#505255] dark:text-[#A0A2A5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#A0A2A5] shrink-0" />
                    )}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeClosingItem(item.id);
                    }}
                    className="text-[#A0A2A5] hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add closing item (e.g. push code commit, wipe whiteboard)..."
                value={newClosingItem}
                onChange={e => setNewClosingItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addClosingItem(newClosingItem);
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
              <button
                type="button"
                onClick={() => addClosingItem(newClosingItem)}
                className="flex items-center gap-1 px-4 py-2.5 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUIDED BREATHING */}
        {activeStep === 3 && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Preservation Step 3 of 4
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Transition Breathing (4-4-4-4 Box Technique)
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-md mx-auto">
                Shift your nervous system from intense analytical drive into calm parasympathetic restoration.
              </p>
            </div>

            {/* Animated Expanding/Contracting Breathing Circle */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 mx-auto flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full border-2 border-[#2D5A46] dark:border-[#4E9473] bg-[#2D5A46]/10 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
                  breathingPhase === 'inhale'
                    ? 'scale-125 opacity-100'
                    : breathingPhase === 'hold1'
                    ? 'scale-125 opacity-90'
                    : breathingPhase === 'exhale'
                    ? 'scale-85 opacity-60'
                    : 'scale-85 opacity-50'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A46] dark:text-[#4E9473]">
                  {breathingPhase === 'inhale' && 'Inhale Slowly'}
                  {breathingPhase === 'hold1' && 'Hold Gently'}
                  {breathingPhase === 'exhale' && 'Exhale Softly'}
                  {breathingPhase === 'hold2' && 'Rest'}
                </span>
                <span className="text-3xl font-bold font-mono text-[#1C1D1F] dark:text-white tabular-nums mt-1">
                  {breathCounter}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="px-4 py-2 border border-[#E5E5DF] dark:border-[#26282B] rounded-lg text-xs font-medium text-[#505255] dark:text-[#A0A2A5]"
              >
                {isBreathingActive ? 'Pause Exercise' : 'Resume Exercise'}
              </button>

              <button
                type="button"
                onClick={() => {
                  updateSessionDraft(prev => ({
                    ...prev,
                    closingActivities: {
                      ...(prev.closingActivities || closing),
                      breathingCompleted: true,
                    },
                  }));
                  setActiveStep(4);
                }}
                className="px-4 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GRATITUDE & 1-10 EVALUATION */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Preservation Step 4 of 4
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Gratitude Reflection & Session Evaluation
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Acknowledge your honest effort and evaluate Focus, Energy, and Satisfaction on a 1–10 scale.
              </p>
            </div>

            {/* Gratitude text prompt */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Gratitude Reflection
              </label>
              <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                What went well? What progress did you make? What are you grateful for today?
              </p>
              <textarea
                rows={2}
                value={closing.gratitudeReflection || ''}
                onChange={e =>
                  updateSessionDraft(prev => ({
                    ...prev,
                    closingActivities: {
                      ...(prev.closingActivities || closing),
                      gratitudeReflection: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. Grateful for uninterrupted quiet time, solving the difficult math exercise, and honoring my study schedule."
                className="w-full text-xs p-3 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>

            {/* 3 Metric Sliders (1 to 10 scale) */}
            <div className="bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B] rounded-2xl p-5 md:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  Performance Metrics Rating (1 – 10)
                </h3>
                <div className="text-right">
                  <span className="text-xs text-[#717376] dark:text-[#9A9CA0] block">
                    Calculated Average Score
                  </span>
                  <span className="text-lg font-bold font-mono text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                    {currentAverageScore.toFixed(1)} / 10
                  </span>
                </div>
              </div>

              {/* Metric A: Focus */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    1. Focus: How focused were you throughout this session?
                  </span>
                  <span className="font-bold font-mono text-sm text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                    {focus} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={focus}
                  onChange={e =>
                    updateSessionDraft(prev => ({
                      ...prev,
                      focusRating: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-[#2D5A46] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[#8E9094]">
                  <span>1: Extremely distracted</span>
                  <span>10: Completely focused</span>
                </div>
              </div>

              {/* Metric B: Energy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    2. Energy: How was your physical & mental energy?
                  </span>
                  <span className="font-bold font-mono text-sm text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                    {energy} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={energy}
                  onChange={e =>
                    updateSessionDraft(prev => ({
                      ...prev,
                      energyRating: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-[#2D5A46] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[#8E9094]">
                  <span>1: Completely exhausted</span>
                  <span>10: Highly energetic</span>
                </div>
              </div>

              {/* Metric C: Satisfaction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    3. Satisfaction: How satisfied are you with the outcome?
                  </span>
                  <span className="font-bold font-mono text-sm text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                    {satisfaction} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={satisfaction}
                  onChange={e =>
                    updateSessionDraft(prev => ({
                      ...prev,
                      satisfactionRating: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-[#2D5A46] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[#8E9094]">
                  <span>1: Extremely dissatisfied</span>
                  <span>10: Extremely satisfied</span>
                </div>
              </div>

              {/* Optional Reflection */}
              <div className="space-y-1.5 pt-2 border-t border-[#EAEAE4] dark:border-[#26282B]">
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                  What could you improve in your next session?
                </label>
                <input
                  type="text"
                  value={sessionDraft.reflection || ''}
                  onChange={e => updateSessionDraft(prev => ({ ...prev, reflection: e.target.value }))}
                  placeholder="e.g. Put phone in another room, hydrate earlier, prepare notebook ahead."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F] text-[#1C1D1F] dark:text-white"
                />
              </div>
            </div>

            {/* Session Completion Summary Breakdown */}
            <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#1A1C1F] text-xs space-y-2 border border-[#E5E5DF] dark:border-[#26282B]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">Session Summary</span>
                <span className="font-mono tabular-nums text-[#2D5A46] dark:text-[#4E9473] font-semibold">
                  {formatDuration(sessionDraft.actualDuration || 0)} focus time
                </span>
              </div>
              <div className="flex items-center gap-3 text-[#505255] dark:text-[#A0A2A5]">
                <span>Targets Completed: {sessionDraft.targets?.filter(t => t.completed).length || 0} of {sessionDraft.targets?.length || 0}</span>
                <span aria-hidden="true">·</span>
                <span>Technique: {sessionDraft.timeBlockType}</span>
                <span aria-hidden="true">·</span>
                <span>Score: {currentAverageScore.toFixed(1)}/10</span>
              </div>
            </div>

            {/* Complete & Save Button */}
            <button
              onClick={handleFinishSave}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#2D5A46] hover:bg-[#204233] text-white text-sm font-bold rounded-xl shadow-md transition-all transform active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Complete & Save Session</span>
            </button>
          </div>
        )}

        {/* Stepper Footer Controls (for steps 1-3) */}
        {activeStep < 4 && (
          <div className="flex items-center justify-between pt-6 border-t border-[#EAEAE4] dark:border-[#26282B]">
            {activeStep > 1 ? (
              <button
                onClick={() => setActiveStep(activeStep - 1)}
                className="flex items-center gap-1 px-4 py-2 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-xs font-semibold text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5] dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => setActiveStep(activeStep + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>Next Activity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
