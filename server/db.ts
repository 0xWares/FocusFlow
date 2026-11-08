import mongoose from 'mongoose';
import { UserModel } from './models/User';
import { StudySessionModel } from './models/StudySession';
import { GoalModel } from './models/Goal';
import { DailyPlanModel } from './models/DailyPlan';
import { generateSalt, hashPassword } from './auth';

let isConnected = false;
let connectionError: string | null = null;

export async function connectToDatabase(): Promise<{ isConnected: boolean; error?: string }> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return { isConnected: true };
  }

  try {
    const mongodbUri = process.env.MONGODB_URI?.trim();
    if (!mongodbUri) {
      throw new Error('MONGODB_URI is not configured in the deployment environment.');
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(mongodbUri, {
      dbName: 'FocusFlow',
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    connectionError = null;
    console.log('[MongoDB] Connected successfully to FocusFlow database cluster.');

    // Auto-seed demo records if collection is empty
    await seedInitialDataIfEmpty();

    return { isConnected: true };
  } catch (err: any) {
    isConnected = false;
    connectionError = err.message || 'Failed to connect to MongoDB';
    console.error('[MongoDB] Connection error:', connectionError);
    return { isConnected: false, error: connectionError || undefined };
  }
}

export function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    databaseName: mongoose.connection.name || 'FocusFlow',
    host: mongoose.connection.host || 'cluster0.kyfjixo.mongodb.net',
    error: connectionError,
  };
}

async function seedInitialDataIfEmpty() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Seeding initial user and study sessions...');

      const alexSalt = generateSalt();
      const defaultUser = await UserModel.create({
        id: 'usr_alex_chen',
        username: 'alex',
        passwordSalt: alexSalt,
        passwordHash: hashPassword('focus123', alexSalt),
        name: 'Alex Chen',
        email: 'alex.chen@university.edu',
        studyField: 'Computer Science & Cognitive Psychology',
        preferences: {
          defaultPomodoroWork: 25,
          defaultPomodoroBreak: 5,
          defaultUltradianWork: 90,
          defaultUltradianBreak: 20,
          soundEnabled: true,
          ambientSound: 'none',
          ambientVolume: 0.35,
          theme: 'light',
          defaultSpaceChecklist: [
            'My study desk is clean and organized',
            'My phone is on silent or Do Not Disturb',
            'Unnecessary browser tabs and notifications are closed',
            'My study environment is comfortable and ventilated',
            'Lighting is optimal for reading and screen work',
            'Distractions have been minimized',
            'I have entered my designated study space',
          ],
          defaultEnergyChecklist: [
            'Drinking water bottle is filled and within reach',
            'Healthy snacks or food prepared if needed',
            'Comfortable clothing suitable for extended focus',
            'Coffee or herbal tea ready (optional)',
            'Necessary medication or essentials prepared',
          ],
          defaultResourceChecklist: [
            'Laptop/Computer charged and set up',
            'Notebook and stationery ready',
            'Textbooks, PDF readers, or research papers open',
            'Primary documentation, notes, or code IDE ready',
            'Calculator or specialized study tools',
          ],
          defaultClosingChecklist: [
            'Close unnecessary tabs and terminal sessions',
            'Save and commit important files or code',
            'Organize notes and physical materials',
            'Wipe down desk and return items to proper places',
            'Prepare materials and desk for the next session',
          ],
          preferredTechnique: 'dot-focus',
          dailyHourTarget: 4,
        },
      });

      // Seed 6 sessions
      const now = new Date();
      const sampleSessions = [
        {
          id: 'session_seed_1',
          userId: 'usr_alex_chen',
          title: 'Distributed Systems — Raft Consensus Protocol',
          subject: 'Distributed Systems',
          sessionDate: new Date(now.getTime() - 2 * 3600 * 1000),
          timeBlockType: 'ultradian',
          plannedDuration: 90,
          actualDuration: 90,
          breakDuration: 15,
          focusRating: 9,
          energyRating: 8,
          satisfactionRating: 9,
          averageScore: 8.7,
          targets: [
            { id: 't1', title: 'Implement leader election state machine', completed: true, priority: 'high' },
            { id: 't2', title: 'Write unit tests for split-vote split-brain edge case', completed: true, priority: 'high' },
            { id: 't3', title: 'Review heartbeat timer randomization logic', completed: true, priority: 'medium' },
          ],
          sessionNotes: {
            summary: 'Completed candidate state transition and randomized election timers.',
            conceptsLearned: ['Randomized timer spread prevents split votes', 'Term monotonicity guarantees'],
            problemsSolved: ['Fixed deadlock during candidate requests'],
            ideasDiscovered: ['Pre-vote protocol mitigates spurious elections'],
            questions: ['How does etcd optimize leader lease renewal?'],
            markdownNotes: '### Core Raft Takeaways\n- State machine replication requires linearizable semantics.',
          },
          closingActivities: {
            organizeChecklist: [
              { id: 'c1', label: 'Close terminal tabs', checked: true },
              { id: 'c2', label: 'Commit code changes', checked: true },
            ],
            breathingCompleted: true,
            breathingDurationSeconds: 120,
            gratitudeReflection: 'Grateful for deep, undisturbed concentration and clean algorithm progress.',
          },
          reflection: 'The 90-minute ultradian block felt natural. Closing all chat channels eliminated interruption drag.',
          status: 'completed',
        },
        {
          id: 'session_seed_2',
          userId: 'usr_alex_chen',
          title: 'Operating Systems — Virtual Memory Paging & TLB',
          subject: 'Computer Architecture',
          sessionDate: new Date(now.getTime() - 26 * 3600 * 1000),
          timeBlockType: 'pomodoro',
          plannedDuration: 50,
          actualDuration: 50,
          breakDuration: 10,
          focusRating: 8,
          energyRating: 7,
          satisfactionRating: 8,
          averageScore: 7.7,
          targets: [
            { id: 't4', title: 'Multi-level page table address translations', completed: true, priority: 'high' },
            { id: 't5', title: 'Calculate TLB hit rates under LRU replacement', completed: true, priority: 'medium' },
          ],
          sessionNotes: {
            summary: 'Worked through 4-level page tables and inverted table trade-offs.',
            conceptsLearned: ['CR3 register holds root physical page directory'],
            problemsSolved: ['Solved 3 translation practice exercises'],
            ideasDiscovered: ['Huge pages (2MB) reduce TLB miss penalty'],
            questions: [],
            markdownNotes: 'Multi-level paging saves physical space by leaving unallocated virtual memory sparse.',
          },
          closingActivities: {
            organizeChecklist: [{ id: 'c3', label: 'Clean desk', checked: true }],
            breathingCompleted: true,
            breathingDurationSeconds: 120,
            gratitudeReflection: 'Glad to clarify multi-level memory addressing.',
          },
          reflection: 'Take a short walking break instead of scrolling phone during the 10m break.',
          status: 'completed',
        },
        {
          id: 'session_seed_3',
          userId: 'usr_alex_chen',
          title: 'Machine Learning — Optimization & Gradient Descent',
          subject: 'Artificial Intelligence',
          sessionDate: new Date(now.getTime() - 50 * 3600 * 1000),
          timeBlockType: 'pomodoro',
          plannedDuration: 50,
          actualDuration: 50,
          breakDuration: 10,
          focusRating: 9,
          energyRating: 9,
          satisfactionRating: 9,
          averageScore: 9.0,
          targets: [
            { id: 't6', title: 'Derive Adam optimizer moment updates', completed: true, priority: 'high' },
            { id: 't7', title: 'Implement momentum vector calculation', completed: true, priority: 'high' },
          ],
          sessionNotes: {
            summary: 'Derived moving average of squared gradients and bias correction.',
            conceptsLearned: ['First and second raw moment estimates'],
            problemsSolved: ['Fixed vector broadcasting in update loop'],
            ideasDiscovered: ['Warmup cosine decay scheduler mitigates instability'],
            questions: [],
            markdownNotes: 'Adam combines the advantages of AdaGrad and RMSProp.',
          },
          closingActivities: {
            organizeChecklist: [{ id: 'c4', label: 'Organize notes', checked: true }],
            breathingCompleted: true,
            breathingDurationSeconds: 120,
            gratitudeReflection: 'Great mental clarity today.',
          },
          reflection: 'The dot-focus technique before studying helped settle my mind.',
          status: 'completed',
        },
      ];

      await StudySessionModel.insertMany(sampleSessions);

      // Seed initial goals
      await GoalModel.insertMany([
        {
          id: 'goal_daily_1',
          userId: 'usr_alex_chen',
          title: 'Daily Deep Study Hours',
          description: 'Accumulate minimum 3.5 hours of uninterrupted deliberate study.',
          goalType: 'daily',
          targetValue: 4,
          currentValue: 3.5,
          unit: 'hours',
          status: 'active',
        },
        {
          id: 'goal_daily_2',
          userId: 'usr_alex_chen',
          title: 'Complete 3 Intentional Sessions',
          description: 'Execute complete preparation and closing ritual for every session.',
          goalType: 'daily',
          targetValue: 3,
          currentValue: 2,
          unit: 'sessions',
          status: 'active',
        },
        {
          id: 'goal_weekly_1',
          userId: 'usr_alex_chen',
          title: 'Weekly Focus Target: 24 Hours',
          description: 'Total weekly focused work across distributed systems and machine learning.',
          goalType: 'weekly',
          targetValue: 24,
          currentValue: 18.5,
          unit: 'hours',
          status: 'active',
        },
      ]);

      console.log('[MongoDB] Seed data populated successfully.');
    }

    // Ensure all existing users have usernames and valid passwords
    const usersWithoutAuth = await UserModel.find({
      $or: [{ username: { $exists: false } }, { passwordHash: { $exists: false } }],
    });
    for (const u of usersWithoutAuth) {
      const salt = generateSalt();
      u.username = u.username || (u.id === 'usr_alex_chen' ? 'alex' : u.name.toLowerCase().replace(/\s+/g, '_'));
      u.passwordSalt = salt;
      u.passwordHash = hashPassword('focus123', salt);
      await u.save();
    }

    // Ensure second demo user (Sarah) exists for immediate multi-user switching
    const sarahExists = await UserModel.findOne({ username: 'sarah' });
    if (!sarahExists) {
      const sSalt = generateSalt();
      await UserModel.create({
        id: 'usr_sarah_connor',
        username: 'sarah',
        passwordSalt: sSalt,
        passwordHash: hashPassword('focus123', sSalt),
        name: 'Sarah Connor',
        email: 'sarah.connor@university.edu',
        studyField: 'Cybernetics & Robotics',
        preferences: {
          defaultPomodoroWork: 50,
          defaultPomodoroBreak: 10,
          defaultUltradianWork: 90,
          defaultUltradianBreak: 20,
          soundEnabled: true,
          ambientSound: 'rain',
          ambientVolume: 0.4,
          theme: 'dark',
          defaultSpaceChecklist: [
            'Robotics workstation cleared',
            'Hardware debuggers and oscilloscope connected',
            'Phone in silent dock',
          ],
          defaultEnergyChecklist: [
            'Electrolyte water ready',
            'Espresso shot prepared',
          ],
          defaultResourceChecklist: [
            'ROS2 Humble workspace compiled',
            'Sensor calibration data sheets open',
          ],
          defaultClosingChecklist: [
            'Power down peripheral test rigs',
            'Push git commits to dev branch',
          ],
          preferredTechnique: 'spiral',
          dailyHourTarget: 5,
        },
      });

      // Sarah's distinct initial goal
      await GoalModel.create({
        id: 'goal_sarah_1',
        userId: 'usr_sarah_connor',
        title: 'Master Kalman Filter Sensor Fusion',
        description: 'Complete 15 hours of state estimation implementations.',
        goalType: 'weekly',
        targetValue: 15,
        currentValue: 8.5,
        unit: 'hours',
        status: 'active',
      });
    }

    // Check if tomorrow's plan exists for Alex
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwDateStr = tmrw.toISOString().split('T')[0];

    const planCount = await DailyPlanModel.countDocuments({ userId: 'usr_alex_chen', date: tmrwDateStr });
    if (planCount === 0) {
      await DailyPlanModel.create({
        id: `plan_alex_${tmrwDateStr}`,
        userId: 'usr_alex_chen',
        date: tmrwDateStr,
        title: 'Tomorrow Deep Work & Mastery Plan',
        topPriorities: [
          {
            id: `tp_1_${Date.now()}`,
            title: 'Master Raft Consensus State Transitions',
            description: 'Implement candidate election loop and randomized timer spread.',
            estimatedMinutes: 90,
            priority: 'critical',
            completed: false,
            linkedActivityId: `act_alex_study_1_${tmrwDateStr}`,
          },
          {
            id: `tp_2_${Date.now()}`,
            title: 'Virtual Memory Multi-Level Paging Review',
            description: 'Work through TLB shootdown edge cases and 4-level inverted tables.',
            estimatedMinutes: 50,
            priority: 'high',
            completed: false,
            linkedActivityId: `act_alex_study_2_${tmrwDateStr}`,
          },
          {
            id: `tp_3_${Date.now()}`,
            title: 'Cognitive Load & Deliberate Practice Notes',
            description: 'Synthesize chapter 4 notes into flashcards.',
            estimatedMinutes: 45,
            priority: 'medium',
            completed: false,
          },
        ],
        secondaryTasks: [
          { id: `st_1_${Date.now()}`, title: 'Review open pull requests on git', completed: false },
          { id: `st_2_${Date.now()}`, title: 'Fill water bottles and prep desk tonight', completed: true },
        ],
        activities: [
          {
            id: `act_alex_morn_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Morning Sunlight & Mindful Wake-up',
            description: 'Hydration, gentle movement, light review of daily intentions.',
            category: 'personal',
            startTime: '07:00',
            endTime: '07:45',
            durationMinutes: 45,
            priority: 'medium',
            status: 'scheduled',
            isFixed: true,
          },
          {
            id: `act_alex_study_1_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Deep Work Session 1: Raft Consensus Protocol',
            description: 'Implement candidate election loop and randomized timer spread.',
            category: 'study',
            startTime: '08:00',
            endTime: '09:30',
            durationMinutes: 90,
            priority: 'critical',
            status: 'scheduled',
            isStudySession: true,
            studySessionConfig: {
              subject: 'Distributed Systems',
              learningObjective: 'Complete randomized election timers and term monotonicity.',
              timeBlockType: 'ultradian',
              ultradianWork: 90,
              ultradianBreak: 20,
              targets: [
                { title: 'Leader election state machine implementation', priority: 'high' },
                { title: 'Split-vote test case verification', priority: 'high' },
              ],
            },
          },
          {
            id: `act_alex_break_1_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Ultradian Recovery Downtime',
            description: 'Step away from all screens, green tea, light stretching.',
            category: 'break',
            startTime: '09:30',
            endTime: '09:50',
            durationMinutes: 20,
            priority: 'low',
            status: 'scheduled',
          },
          {
            id: `act_alex_study_2_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Deep Work Session 2: Virtual Memory & TLB',
            description: 'Deep dive into TLB cache miss penalties and page tables.',
            category: 'study',
            startTime: '10:00',
            endTime: '11:00',
            durationMinutes: 60,
            priority: 'high',
            status: 'scheduled',
            isStudySession: true,
            studySessionConfig: {
              subject: 'Computer Architecture',
              learningObjective: 'Analyze page fault handling in modern x86-64.',
              timeBlockType: 'pomodoro',
              pomodoroWork: 50,
              pomodoroBreak: 10,
              targets: [{ title: 'Solve 3 problem sets on TLB reach', priority: 'high' }],
            },
          },
          {
            id: `act_alex_lunch_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Nutritious Lunch & Rest',
            description: 'Healthy meal, social break, complete mental detachment from study.',
            category: 'meals',
            startTime: '12:00',
            endTime: '13:00',
            durationMinutes: 60,
            priority: 'medium',
            status: 'scheduled',
          },
          {
            id: `act_alex_gym_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Gym Workout & Cardiovascular Health',
            description: 'Strength training and zone 2 cardio.',
            category: 'exercise',
            startTime: '16:00',
            endTime: '17:15',
            durationMinutes: 75,
            priority: 'high',
            status: 'scheduled',
          },
          {
            id: `act_alex_eve_${tmrwDateStr}`,
            userId: 'usr_alex_chen',
            date: tmrwDateStr,
            title: 'Daily Review & Next Day Planning',
            description: 'Preserve progress, evaluate study scores, configure tomorrow.',
            category: 'personal',
            startTime: '21:30',
            endTime: '22:00',
            durationMinutes: 30,
            priority: 'medium',
            status: 'scheduled',
          },
        ],
        status: 'planned',
      });
    }
  } catch (err) {
    console.warn('[MongoDB] Auto-seed check finished with note:', err);
  }
}
