import mongoose, { Schema, Document } from 'mongoose';

export interface IPlannerActivity {
  id: string;
  userId: string;
  date: string;
  title: string;
  description?: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled';
  isFixed?: boolean;
  isFlexible?: boolean;
  reminderMinutesBefore?: number;
  repeat?: 'none' | 'daily' | 'weekly';
  notes?: string;
  linkedGoalId?: string;
  linkedSessionId?: string;
  isStudySession?: boolean;
  studySessionConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ITopPriority {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  completed: boolean;
  linkedActivityId?: string;
}

export interface ISecondaryTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface IDailyReview {
  completedActivitiesCount: number;
  skippedActivitiesCount: number;
  rescheduledActivitiesCount: number;
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  completionRate: number;
  whatWentWell: string;
  whatToImprove: string;
  evaluation: string;
  completedAt: string;
}

export interface IDailyPlan extends Document {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title?: string;
  topPriorities: ITopPriority[];
  secondaryTasks: ISecondaryTask[];
  activities: IPlannerActivity[];
  dailyReview?: IDailyReview;
  status: 'draft' | 'planned' | 'in-progress' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const PlannerActivitySchema = new Schema<IPlannerActivity>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'study' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'skipped', 'rescheduled'],
      default: 'scheduled',
    },
    isFixed: { type: Boolean, default: false },
    isFlexible: { type: Boolean, default: true },
    reminderMinutesBefore: { type: Number, default: 10 },
    repeat: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
    notes: { type: String, default: '' },
    linkedGoalId: { type: String, default: null },
    linkedSessionId: { type: String, default: null },
    isStudySession: { type: Boolean, default: false },
    studySessionConfig: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false }
);

const TopPrioritySchema = new Schema<ITopPriority>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 60 },
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'high' },
    completed: { type: Boolean, default: false },
    linkedActivityId: { type: String, default: null },
  },
  { _id: false }
);

const SecondaryTaskSchema = new Schema<ISecondaryTask>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const DailyPlanSchema = new Schema<IDailyPlan>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    title: { type: String, default: 'Tomorrow Plan' },
    topPriorities: { type: [TopPrioritySchema], default: [] },
    secondaryTasks: { type: [SecondaryTaskSchema], default: [] },
    activities: { type: [PlannerActivitySchema], default: [] },
    dailyReview: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['draft', 'planned', 'in-progress', 'reviewed'],
      default: 'planned',
    },
  },
  { timestamps: true }
);

// Ensure a single plan per user per date
DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyPlanModel =
  mongoose.models.DailyPlan || mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);
