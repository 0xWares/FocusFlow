/**
 * Goal Create & Edit Modal.
 */

import React, { useState, useEffect } from 'react';
import { X, Target, Plus, Check } from 'lucide-react';
import { Goal } from '../../types';

interface GoalModalProps {
  goal?: Goal | null;
  userId: string;
  onSave: (goal: Goal) => void;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  goal,
  userId,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>(goal?.goalType || 'daily');
  const [targetValue, setTargetValue] = useState<number>(goal?.targetValue || 4);
  const [currentValue, setCurrentValue] = useState<number>(goal?.currentValue || 0);
  const [unit, setUnit] = useState<'hours' | 'sessions' | 'targets'>(goal?.unit || 'hours');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) return;

    const savedGoal: Goal = {
      id: goal?.id || `goal_${Date.now()}`,
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      goalType,
      targetValue,
      currentValue,
      unit,
      status: currentValue >= targetValue ? 'completed' : 'active',
      createdAt: goal?.createdAt || new Date().toISOString(),
    };

    onSave(savedGoal);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EAEAE4] dark:border-[#26282B] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#1C1D1F] dark:text-[#FBFBF9]">
              {goal ? 'Edit Goal' : 'Create New Study Goal'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#717376] hover:text-[#1C1D1F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Graph Theory Algorithms"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Concrete expectations, chapter numbers, or course syllabus..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                Goal Cadence
              </label>
              <select
                value={goalType}
                onChange={e => setGoalType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              >
                <option value="daily">Daily Goal</option>
                <option value="weekly">Weekly Goal</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              >
                <option value="hours">Hours</option>
                <option value="sessions">Sessions</option>
                <option value="targets">Study Targets</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                Target Value *
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={targetValue}
                onChange={e => setTargetValue(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1">
                Current Progress
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={currentValue}
                onChange={e => setCurrentValue(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAEAE4] dark:border-[#26282B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-[#505255] hover:text-[#1C1D1F] dark:text-[#A0A2A5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2D5A46] text-white rounded-xl text-xs font-semibold hover:bg-[#254B3A]"
            >
              {goal ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
