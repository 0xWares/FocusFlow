/**
 * Phase 1: Preparation Component.
 * Implements the 5 mandatory checkpoints:
 * Checkpoint 1: Time Block (Pomodoro vs Ultradian)
 * Checkpoint 2: Space Block (physical environment checklist + custom items)
 * Checkpoint 3: Energy Check (water, snacks, clothing + readiness)
 * Checkpoint 4: Resources Check (computer, books, tools + readiness)
 * Checkpoint 5: Psyche / Mind Preparation (intention, targets, mental clarity)
 */

import React, { useState } from 'react';
import {
  Clock,
  Layout,
  Zap,
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { ChecklistItem, StudyTarget, TimeBlockType, PriorityLevel } from '../../types';

export const PreparationPhase: React.FC = () => {
  const {
    currentPrepStep,
    setPrepStep,
    sessionDraft,
    updateSessionDraft,
    completePreparation,
  } = useSession();

  const [newSpaceItem, setNewSpaceItem] = useState('');
  const [newEnergyItem, setNewEnergyItem] = useState('');
  const [newResourceItem, setNewResourceItem] = useState('');

  // Target creator draft
  const [targetTitle, setTargetTitle] = useState('');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [targetPriority, setTargetPriority] = useState<PriorityLevel>('high');

  const prep = sessionDraft?.preparation;

  if (!prep) return null;

  // Checklist toggles
  const toggleChecklistItem = (
    listName: 'spaceChecklist' | 'energyChecklist' | 'resourceChecklist',
    itemId: string
  ) => {
    updateSessionDraft(prev => {
      if (!prev.preparation) return prev;
      const list = prev.preparation[listName] || [];
      const updated = list.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      return {
        ...prev,
        preparation: {
          ...prev.preparation,
          [listName]: updated,
        },
      };
    });
  };

  const addChecklistItem = (
    listName: 'spaceChecklist' | 'energyChecklist' | 'resourceChecklist',
    label: string
  ) => {
    if (!label.trim()) return;
    updateSessionDraft(prev => {
      if (!prev.preparation) return prev;
      const list = prev.preparation[listName] || [];
      const newItem: ChecklistItem = {
        id: `item_${Date.now()}`,
        label: label.trim(),
        checked: true,
      };
      return {
        ...prev,
        preparation: {
          ...prev.preparation,
          [listName]: [...list, newItem],
        },
      };
    });
  };

  const removeChecklistItem = (
    listName: 'spaceChecklist' | 'energyChecklist' | 'resourceChecklist',
    itemId: string
  ) => {
    updateSessionDraft(prev => {
      if (!prev.preparation) return prev;
      const list = prev.preparation[listName] || [];
      return {
        ...prev,
        preparation: {
          ...prev.preparation,
          [listName]: list.filter(item => item.id !== itemId),
        },
      };
    });
  };

  // Target management
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitle.trim()) return;

    const newTarget: StudyTarget = {
      id: `target_${Date.now()}`,
      title: targetTitle.trim(),
      expectedOutcome: targetOutcome.trim() || undefined,
      priority: targetPriority,
      completed: false,
    };

    updateSessionDraft(prev => {
      if (!prev.preparation) return prev;
      const curTargets = prev.preparation.targets || [];
      return {
        ...prev,
        preparation: {
          ...prev.preparation,
          targets: [...curTargets.filter(t => t.title.trim() !== ''), newTarget],
        },
      };
    });

    setTargetTitle('');
    setTargetOutcome('');
    setTargetPriority('high');
  };

  const handleRemoveTarget = (targetId: string) => {
    updateSessionDraft(prev => {
      if (!prev.preparation) return prev;
      return {
        ...prev,
        preparation: {
          ...prev.preparation,
          targets: (prev.preparation.targets || []).filter(t => t.id !== targetId),
        },
      };
    });
  };

  const steps = [
    { num: 1, label: 'Time Block', icon: Clock },
    { num: 2, label: 'Space Block', icon: Layout },
    { num: 3, label: 'Energy Check', icon: Zap },
    { num: 4, label: 'Resources Check', icon: BookOpen },
    { num: 5, label: 'Psyche & Targets', icon: Brain },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 5-Step Checkpoint Stepper Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {steps.map(s => {
            const Icon = s.icon;
            const isCurrent = currentPrepStep === s.num;
            const isCompleted = currentPrepStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => setPrepStep(s.num)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] font-semibold'
                    : isCompleted
                    ? 'text-[#505255] dark:text-[#A0A2A5] hover:bg-[#F5F5F0] dark:hover:bg-[#202225]'
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
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" /> : s.num}
                </div>
                <span className="text-[11px] truncate w-full hidden sm:block">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Checkpoint Step Body */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
        {/* CHECKPOINT 1: TIME BLOCK */}
        {currentPrepStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Checkpoint 1 of 5
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Choose Your Time Block Management Technique
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Select between structured Pomodoro cycles or an expansive Ultradian Rhythm block.
              </p>
            </div>

            {/* Technique Toggle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Pomodoro */}
              <div
                onClick={() => {
                  updateSessionDraft(prev => ({
                    ...prev,
                    timeBlockType: 'pomodoro',
                    preparation: {
                      ...prev.preparation!,
                      timeBlockType: 'pomodoro',
                    },
                  }));
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  sessionDraft?.timeBlockType === 'pomodoro'
                    ? 'border-[#2D5A46] bg-[#2D5A46]/5 dark:border-[#4E9473] dark:bg-[#2D5A46]/10'
                    : 'border-[#E5E5DF] dark:border-[#26282B] hover:border-[#C0C0BA]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#2D5A46] dark:text-[#4E9473]" />
                    <h3 className="font-bold text-base text-[#1C1D1F] dark:text-[#FBFBF9]">
                      Pomodoro Technique
                    </h3>
                  </div>
                  {sessionDraft?.timeBlockType === 'pomodoro' && (
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A46] dark:text-[#4E9473]" />
                  )}
                </div>
                <p className="text-xs text-[#505255] dark:text-[#A0A2A5] mb-4">
                  High-tempo focused sprints with short active rest periods. Ideal for problem sets, reading, and discrete tasks.
                </p>

                {/* Preset presets */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { work: 25, brk: 5, label: '25 / 5 min' },
                    { work: 50, brk: 10, label: '50 / 10 min' },
                    { work: 90, brk: 15, label: '90 / 15 min' },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        updateSessionDraft(prev => ({
                          ...prev,
                          timeBlockType: 'pomodoro',
                          plannedDuration: p.work,
                          preparation: {
                            ...prev.preparation!,
                            timeBlockType: 'pomodoro',
                            pomodoroWorkMinutes: p.work,
                            pomodoroBreakMinutes: p.brk,
                          },
                        }));
                      }}
                      className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                        prep.pomodoroWorkMinutes === p.work && sessionDraft?.timeBlockType === 'pomodoro'
                          ? 'bg-[#2D5A46] text-white border-[#2D5A46]'
                          : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#1C1D1F] dark:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom duration inputs */}
                {sessionDraft?.timeBlockType === 'pomodoro' && (
                  <div className="mt-4 pt-4 border-t border-[#EAEAE4] dark:border-[#26282B] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Focus (min)</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={prep.pomodoroWorkMinutes}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 25);
                          updateSessionDraft(prev => ({
                            ...prev,
                            preparation: { ...prev.preparation!, pomodoroWorkMinutes: val },
                          }));
                        }}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Break (min)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={prep.pomodoroBreakMinutes}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 5);
                          updateSessionDraft(prev => ({
                            ...prev,
                            preparation: { ...prev.preparation!, pomodoroBreakMinutes: val },
                          }));
                        }}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option B: Ultradian Rhythm */}
              <div
                onClick={() => {
                  updateSessionDraft(prev => ({
                    ...prev,
                    timeBlockType: 'ultradian',
                    plannedDuration: 90,
                    preparation: {
                      ...prev.preparation!,
                      timeBlockType: 'ultradian',
                    },
                  }));
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  sessionDraft?.timeBlockType === 'ultradian'
                    ? 'border-[#2D5A46] bg-[#2D5A46]/5 dark:border-[#4E9473] dark:bg-[#2D5A46]/10'
                    : 'border-[#E5E5DF] dark:border-[#26282B] hover:border-[#C0C0BA]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#2D5A46] dark:text-[#4E9473]" />
                    <h3 className="font-bold text-base text-[#1C1D1F] dark:text-[#FBFBF9]">
                      Ultradian Rhythm
                    </h3>
                  </div>
                  {sessionDraft?.timeBlockType === 'ultradian' && (
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A46] dark:text-[#4E9473]" />
                  )}
                </div>
                <p className="text-xs text-[#505255] dark:text-[#A0A2A5] mb-4">
                  Natural 80–90 minute biological peak alertness cycle, followed by a 15–20 minute restorative downtime.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { work: 80, brk: 15, label: '80 / 15 min' },
                    { work: 90, brk: 20, label: '90 / 20 min' },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        updateSessionDraft(prev => ({
                          ...prev,
                          timeBlockType: 'ultradian',
                          plannedDuration: p.work,
                          preparation: {
                            ...prev.preparation!,
                            timeBlockType: 'ultradian',
                            ultradianWorkMinutes: p.work,
                            ultradianBreakMinutes: p.brk,
                          },
                        }));
                      }}
                      className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                        prep.ultradianWorkMinutes === p.work && sessionDraft?.timeBlockType === 'ultradian'
                          ? 'bg-[#2D5A46] text-white border-[#2D5A46]'
                          : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#1C1D1F] dark:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Ultradian inputs */}
                {sessionDraft?.timeBlockType === 'ultradian' && (
                  <div className="mt-4 pt-4 border-t border-[#EAEAE4] dark:border-[#26282B] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Deep Work (min)</label>
                      <input
                        type="number"
                        min="45"
                        max="120"
                        value={prep.ultradianWorkMinutes}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 90);
                          updateSessionDraft(prev => ({
                            ...prev,
                            preparation: { ...prev.preparation!, ultradianWorkMinutes: val },
                          }));
                        }}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Rest Recovery (min)</label>
                      <input
                        type="number"
                        min="10"
                        max="45"
                        value={prep.ultradianBreakMinutes}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 20);
                          updateSessionDraft(prev => ({
                            ...prev,
                            preparation: { ...prev.preparation!, ultradianBreakMinutes: val },
                          }));
                        }}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Title & Subject Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#EAEAE4] dark:border-[#26282B]">
              <div>
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={sessionDraft?.title || ''}
                  onChange={e => updateSessionDraft(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Distributed Systems Homework 3"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                  Study Subject / Domain *
                </label>
                <input
                  type="text"
                  value={sessionDraft?.subject || ''}
                  onChange={e => updateSessionDraft(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Computer Science, Neuroscience, Economics"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* CHECKPOINT 2: SPACE BLOCK */}
        {currentPrepStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Checkpoint 2 of 5
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Space Block — Prepare Your Physical Environment
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                A clean desk and distraction-minimized physical space signals deep focus to the brain.
              </p>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5">
              {(prep.spaceChecklist || []).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem('spaceChecklist', item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-[#2D5A46]/5 border-[#2D5A46]/30 text-[#1C1D1F] dark:text-[#FBFBF9]'
                      : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#505255] dark:text-[#A0A2A5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#A0A2A5] shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${item.checked ? 'text-[#1C1D1F] dark:text-white' : ''}`}>
                      {item.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeChecklistItem('spaceChecklist', item.id);
                    }}
                    className="text-[#A0A2A5] hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Space Item */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom physical space check..."
                value={newSpaceItem}
                onChange={e => setNewSpaceItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem('spaceChecklist', newSpaceItem);
                    setNewSpaceItem('');
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  addChecklistItem('spaceChecklist', newSpaceItem);
                  setNewSpaceItem('');
                }}
                className="flex items-center gap-1 px-4 py-2.5 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* CHECKPOINT 3: ENERGY CHECK */}
        {currentPrepStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Checkpoint 3 of 5
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Energy Check — Fueling Your Biological Engine
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                "Have you prepared everything your body needs for this study session?"
              </p>
            </div>

            {/* Energy Checklist */}
            <div className="space-y-2.5">
              {(prep.energyChecklist || []).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem('energyChecklist', item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-[#2D5A46]/5 border-[#2D5A46]/30 text-[#1C1D1F] dark:text-[#FBFBF9]'
                      : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#505255] dark:text-[#A0A2A5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#A0A2A5] shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${item.checked ? 'text-[#1C1D1F] dark:text-white' : ''}`}>
                      {item.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeChecklistItem('energyChecklist', item.id);
                    }}
                    className="text-[#A0A2A5] hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Energy Item */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom physical/energy item (e.g. herbal tea)..."
                value={newEnergyItem}
                onChange={e => setNewEnergyItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem('energyChecklist', newEnergyItem);
                    setNewEnergyItem('');
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  addChecklistItem('energyChecklist', newEnergyItem);
                  setNewEnergyItem('');
                }}
                className="flex items-center gap-1 px-4 py-2.5 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Readiness Confirmation Toggle */}
            <div className="pt-4 border-t border-[#EAEAE4] dark:border-[#26282B] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Physical Energy Readiness Status:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSessionDraft(prev => ({
                      ...prev,
                      preparation: { ...prev.preparation!, energyConfirmed: true },
                    }));
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    prep.energyConfirmed
                      ? 'bg-[#2D5A46] text-white shadow-xs'
                      : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                  }`}
                >
                  Ready
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSessionDraft(prev => ({
                      ...prev,
                      preparation: { ...prev.preparation!, energyConfirmed: false },
                    }));
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !prep.energyConfirmed
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                  }`}
                >
                  Not Ready Yet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHECKPOINT 4: RESOURCES CHECK */}
        {currentPrepStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Checkpoint 4 of 5
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Resources Check — Tools, Notes & References
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                "Do you have all the resources required to accomplish your study target?"
              </p>
            </div>

            {/* Resource Checklist */}
            <div className="space-y-2.5">
              {(prep.resourceChecklist || []).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem('resourceChecklist', item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-[#2D5A46]/5 border-[#2D5A46]/30 text-[#1C1D1F] dark:text-[#FBFBF9]'
                      : 'bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30] text-[#505255] dark:text-[#A0A2A5]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#A0A2A5] shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${item.checked ? 'text-[#1C1D1F] dark:text-white' : ''}`}>
                      {item.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeChecklistItem('resourceChecklist', item.id);
                    }}
                    className="text-[#A0A2A5] hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Resource Item */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom resource (e.g. Graphing calculator, API reference)..."
                value={newResourceItem}
                onChange={e => setNewResourceItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem('resourceChecklist', newResourceItem);
                    setNewResourceItem('');
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  addChecklistItem('resourceChecklist', newResourceItem);
                  setNewResourceItem('');
                }}
                className="flex items-center gap-1 px-4 py-2.5 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Readiness Confirmation Toggle */}
            <div className="pt-4 border-t border-[#EAEAE4] dark:border-[#26282B] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Materials & Resources Readiness Status:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSessionDraft(prev => ({
                      ...prev,
                      preparation: { ...prev.preparation!, resourcesConfirmed: true },
                    }));
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    prep.resourcesConfirmed
                      ? 'bg-[#2D5A46] text-white shadow-xs'
                      : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                  }`}
                >
                  All Prepared
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSessionDraft(prev => ({
                      ...prev,
                      preparation: { ...prev.preparation!, resourcesConfirmed: false },
                    }));
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !prep.resourcesConfirmed
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                  }`}
                >
                  Missing Items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHECKPOINT 5: PSYCHE & TARGETS */}
        {currentPrepStep === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] uppercase tracking-wider">
                Checkpoint 5 of 5
              </span>
              <h2 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                Psyche & Mind Preparation — Intention & Targets
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
                Clarify your core intention, break down specific targets, and verify mental readiness.
              </p>
            </div>

            {/* A. Session Intention */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                A. Primary Session Intention *
              </label>
              <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                "What is the primary objective of this study session?"
              </p>
              <textarea
                rows={2}
                value={prep.intention || ''}
                onChange={e =>
                  updateSessionDraft(prev => ({
                    ...prev,
                    preparation: { ...prev.preparation!, intention: e.target.value },
                  }))
                }
                placeholder="e.g. Master the Raft candidate leader election algorithm and solve two edge-case unit test scenarios."
                className="w-full text-xs p-3 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>

            {/* B. Specific Targets */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                    B. Concrete Targets ({(prep.targets || []).filter(t => t.title.trim()).length})
                  </label>
                  <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                    Define distinct milestones to cross off during this session.
                  </p>
                </div>
              </div>

              {/* Target items list */}
              <div className="space-y-2">
                {(prep.targets || [])
                  .filter(t => t.title.trim().length > 0)
                  .map(target => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F8F8F6] dark:bg-[#1E2023] border border-[#EAEAE4] dark:border-[#2A2C30] text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] truncate">
                            {target.title}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                              target.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : target.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}
                          >
                            {target.priority}
                          </span>
                        </div>
                        {target.expectedOutcome && (
                          <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0] truncate">
                            Outcome: {target.expectedOutcome}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveTarget(target.id);
                        }}
                        className="text-[#A0A2A5] hover:text-red-500 p-1 rounded transition-colors"
                        title="Remove target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>

              {/* Add target form */}
              <form onSubmit={handleAddTarget} className="space-y-2.5 p-3.5 rounded-xl border border-dashed border-[#D0D0CA] dark:border-[#3A3D42] bg-[#FAF8F5] dark:bg-[#141517]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Target title (e.g. Complete section 4.2 practice exercises)..."
                      value={targetTitle}
                      onChange={e => setTargetTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-white"
                    />
                  </div>
                  <div>
                    <select
                      value={targetPriority}
                      onChange={e => setTargetPriority(e.target.value as PriorityLevel)}
                      className="w-full text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-white"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Expected outcome (optional, e.g. 5 problems solved correctly)..."
                    value={targetOutcome}
                    onChange={e => setTargetOutcome(e.target.value)}
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A] shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Target</span>
                  </button>
                </div>
              </form>
            </div>

            {/* C. Mental Readiness Confirmation */}
            <div className="pt-4 border-t border-[#EAEAE4] dark:border-[#26282B] space-y-3">
              <label className="block text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                C. Mental Readiness & Clarity
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Current Mood</label>
                  <input
                    type="text"
                    value={prep.mood || ''}
                    onChange={e =>
                      updateSessionDraft(prev => ({
                        ...prev,
                        preparation: { ...prev.preparation!, mood: e.target.value },
                      }))
                    }
                    placeholder="e.g. Calm, motivated, alert"
                    className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                  />
                </div>
                <div>
                  <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Mental Clarity</label>
                  <input
                    type="text"
                    value={prep.mentalClarity || ''}
                    onChange={e =>
                      updateSessionDraft(prev => ({
                        ...prev,
                        preparation: { ...prev.preparation!, mentalClarity: e.target.value },
                      }))
                    }
                    placeholder="e.g. High focus, zero clutter"
                    className="w-full p-2 border rounded-lg bg-white dark:bg-[#1E2023] border-[#E0E0DA] dark:border-[#2A2C30]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#505255] dark:text-[#A0A2A5]">
                  "Is your mind clear and ready to focus?"
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateSessionDraft(prev => ({
                      ...prev,
                      preparation: { ...prev.preparation!, mindReady: !prev.preparation?.mindReady },
                    }));
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    prep.mindReady
                      ? 'bg-[#2D5A46] text-white shadow-xs'
                      : 'border border-[#D0D0CA] dark:border-[#3A3D42] text-[#505255] dark:text-[#A0A2A5]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{prep.mindReady ? 'Mind Ready & Focused' : 'Confirm Mind Readiness'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-[#EAEAE4] dark:border-[#26282B]">
          {currentPrepStep > 1 ? (
            <button
              onClick={() => setPrepStep(currentPrepStep - 1)}
              className="flex items-center gap-1 px-4 py-2.5 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-xs font-semibold text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentPrepStep < 5 ? (
            <button
              onClick={() => setPrepStep(currentPrepStep + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>Continue Checkpoint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={completePreparation}
              className="flex items-center gap-2 px-6 py-3 bg-[#2D5A46] hover:bg-[#204233] text-white text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Complete Preparation & Enter Performance Mode</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
