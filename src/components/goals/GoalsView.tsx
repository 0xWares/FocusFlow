/**
 * Goals & Planning Page.
 * Daily and Weekly target management with live progress indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { Goal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { GoalModal } from './GoalModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const GoalsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>(() => db.getGoals(currentUser.id));
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly'>('all');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const refreshGoals = () => {
    setGoals(db.getGoals(currentUser.id));
  };

  useEffect(() => {
    refreshGoals();
    return db.subscribeData(() => {
      refreshGoals();
    });
  }, [currentUser.id]);

  const handleSaveGoal = (goal: Goal) => {
    db.saveGoal(goal);
    refreshGoals();
  };

  const confirmDeleteGoal = () => {
    if (!goalToDelete) return;
    db.deleteGoal(goalToDelete.id);
    refreshGoals();
    setGoalToDelete(null);
  };

  const handleToggleComplete = (goal: Goal) => {
    const updated: Goal = {
      ...goal,
      status: goal.status === 'completed' ? 'active' : 'completed',
      currentValue: goal.status === 'completed' ? goal.currentValue : goal.targetValue,
    };
    db.saveGoal(updated);
    refreshGoals();
  };

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'daily') return g.goalType === 'daily';
    if (activeTab === 'weekly') return g.goalType === 'weekly';
    return true;
  });

  const dailyGoals = goals.filter(g => g.goalType === 'daily');
  const weeklyGoals = goals.filter(g => g.goalType === 'weekly');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
            Goals & Study Planning
          </h1>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            Set daily targets and weekly milestones linked to your study sessions
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Cadence Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#EAEAE4] dark:bg-[#202225] rounded-xl text-xs w-fit">
        {[
          { id: 'all', label: `All Goals (${goals.length})` },
          { id: 'daily', label: `Daily (${dailyGoals.length})` },
          { id: 'weekly', label: `Weekly (${weeklyGoals.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#18191C] text-[#1C1D1F] dark:text-white shadow-xs'
                : 'text-[#717376] dark:text-[#9A9CA0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-[#717376] dark:text-[#9A9CA0]">
            No goals found in this view. Define an intentional milestone to track your momentum.
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map(goal => {
            const isCompleted = goal.status === 'completed' || goal.currentValue >= goal.targetValue;
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

            return (
              <div
                key={goal.id}
                className={`bg-[#FFFFFF] dark:bg-[#18191C] border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-[#2D5A46]/40 dark:border-[#4E9473]/30 bg-[#2D5A46]/5'
                    : 'border-[#E5E5DF] dark:border-[#26282B]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-semibold text-[#717376] dark:text-[#9A9CA0]">
                      {goal.goalType} Goal
                    </span>

                    <button
                      onClick={() => handleToggleComplete(goal)}
                      className={`flex items-center gap-1 font-medium ${
                        isCompleted ? 'text-[#2D5A46] dark:text-[#4E9473]' : 'text-[#A0A2A5]'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Achieved</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>In Progress</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3
                    className={`text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9] ${
                      isCompleted ? 'line-through opacity-85' : ''
                    }`}
                  >
                    {goal.title}
                  </h3>

                  {goal.description && (
                    <p className="text-xs text-[#505255] dark:text-[#A0A2A5] line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar & Numerical Target */}
                <div className="space-y-2 pt-2 border-t border-[#EAEAE4] dark:border-[#26282B]">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-[#505255] dark:text-[#A0A2A5]">Progress</span>
                    <span className="font-bold text-[#1C1D1F] dark:text-white">
                      {goal.currentValue} / {goal.targetValue} {goal.unit} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-[#EAEAE4] dark:bg-[#232528] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-[#2D5A46] dark:bg-[#4E9473]'
                          : 'bg-[#5B9577] dark:bg-[#3A7559]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalToDelete(goal)}
                      className="p-1 text-[#717376] hover:text-red-500 rounded transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isModalOpen && (
        <GoalModal
          goal={editingGoal}
          userId={currentUser.id}
          onSave={handleSaveGoal}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
          }}
        />
      )}

      {/* Confirm Delete Goal Dialog */}
      <ConfirmDialog
        isOpen={!!goalToDelete}
        title="Delete Study Goal"
        description={`Are you sure you want to delete the goal "${goalToDelete?.title}"? This target milestone will be permanently removed.`}
        confirmLabel="Delete Goal"
        isDestructive={true}
        onConfirm={confirmDeleteGoal}
        onClose={() => setGoalToDelete(null)}
      />
    </div>
  );
};
