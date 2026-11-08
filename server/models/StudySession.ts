import mongoose, { Schema, Document } from 'mongoose';

export interface IStudySession extends Document {
  id: string;
  userId: string;
  title: string;
  subject: string;
  sessionDate: Date;
  timeBlockType: 'pomodoro' | 'ultradian';
  plannedDuration: number;
  actualDuration: number;
  breakDuration: number;
  preparation: Record<string, any>;
  selectedTechniques: string[];
  targets: Array<{
    id: string;
    title: string;
    description?: string;
    expectedOutcome?: string;
    priority: string;
    completed: boolean;
  }>;
  sessionNotes: Record<string, any>;
  closingActivities: Record<string, any>;
  focusRating: number;
  energyRating: number;
  satisfactionRating: number;
  averageScore: number;
  reflection?: string;
  status: 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    sessionDate: { type: Date, default: Date.now, index: true },
    timeBlockType: { type: String, enum: ['pomodoro', 'ultradian'], default: 'pomodoro' },
    plannedDuration: { type: Number, default: 25 },
    actualDuration: { type: Number, default: 0 },
    breakDuration: { type: Number, default: 0 },
    preparation: { type: Schema.Types.Mixed, default: {} },
    selectedTechniques: { type: [String], default: ['dot-focus'] },
    targets: [
      {
        id: String,
        title: String,
        description: String,
        expectedOutcome: String,
        priority: { type: String, default: 'high' },
        completed: { type: Boolean, default: false },
      },
    ],
    sessionNotes: { type: Schema.Types.Mixed, default: {} },
    closingActivities: { type: Schema.Types.Mixed, default: {} },
    focusRating: { type: Number, default: 8, min: 1, max: 10 },
    energyRating: { type: Number, default: 8, min: 1, max: 10 },
    satisfactionRating: { type: Number, default: 8, min: 1, max: 10 },
    averageScore: { type: Number, default: 8.0 },
    reflection: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'abandoned'], default: 'completed' },
    linkedActivityId: { type: String, default: null },
  },
  { timestamps: true }
);

export const StudySessionModel =
  mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);
