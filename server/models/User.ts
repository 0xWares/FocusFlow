import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  username: string;
  passwordSalt?: string;
  passwordHash?: string;
  name: string;
  email: string;
  studyField: string;
  preferences: {
    defaultPomodoroWork: number;
    defaultPomodoroBreak: number;
    defaultUltradianWork: number;
    defaultUltradianBreak: number;
    soundEnabled: boolean;
    ambientSound: string;
    ambientVolume: number;
    theme: string;
    defaultSpaceChecklist: string[];
    defaultEnergyChecklist: string[];
    defaultResourceChecklist: string[];
    defaultClosingChecklist: string[];
    preferredTechnique: string;
    dailyHourTarget: number;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, lowercase: true, trim: true },
    passwordSalt: { type: String },
    passwordHash: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    studyField: { type: String, default: 'General Studies' },
    preferences: {
      defaultPomodoroWork: { type: Number, default: 25 },
      defaultPomodoroBreak: { type: Number, default: 5 },
      defaultUltradianWork: { type: Number, default: 90 },
      defaultUltradianBreak: { type: Number, default: 20 },
      soundEnabled: { type: Boolean, default: true },
      ambientSound: { type: String, default: 'none' },
      ambientVolume: { type: Number, default: 0.35 },
      theme: { type: String, default: 'light' },
      defaultSpaceChecklist: { type: [String], default: [] },
      defaultEnergyChecklist: { type: [String], default: [] },
      defaultResourceChecklist: { type: [String], default: [] },
      defaultClosingChecklist: { type: [String], default: [] },
      preferredTechnique: { type: String, default: 'dot-focus' },
      dailyHourTarget: { type: Number, default: 4 },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
