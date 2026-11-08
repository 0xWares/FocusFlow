import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: 'daily' | 'weekly';
  targetValue: number;
  currentValue: number;
  unit: 'hours' | 'sessions' | 'targets';
  deadline?: Date;
  status: 'active' | 'completed';
  createdAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    goalType: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, enum: ['hours', 'sessions', 'targets'], default: 'hours' },
    deadline: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

export const GoalModel = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
