import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectToDatabase, getDatabaseStatus } from '../db';
import { UserModel } from '../models/User';
import { StudySessionModel } from '../models/StudySession';
import { GoalModel } from '../models/Goal';
import { DailyPlanModel } from '../models/DailyPlan';
import { generateSalt, hashPassword, verifyPassword } from '../auth';

export const apiRouter = Router();

// Server-side resilient cache when MongoDB is connecting or disconnected
const memoryStore = {
  users: [
    {
      id: 'usr_alex_chen',
      username: 'alex',
      passwordSalt: 'demo_salt_alex_16',
      passwordHash: hashPassword('focus123', 'demo_salt_alex_16'),
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
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_sarah_connor',
      username: 'sarah',
      passwordSalt: 'demo_salt_sarah_16',
      passwordHash: hashPassword('focus123', 'demo_salt_sarah_16'),
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
      createdAt: new Date().toISOString(),
    },
  ],
  sessions: [
    {
      id: 'session_seed_1',
      userId: 'usr_alex_chen',
      title: 'Distributed Systems — Raft Consensus Protocol',
      subject: 'Distributed Systems',
      sessionDate: new Date(Date.now() - 2 * 3600 * 1000),
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
        { id: 't2', title: 'Write unit tests for candidate votes', completed: true, priority: 'high' },
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
      sessionDate: new Date(Date.now() - 26 * 3600 * 1000),
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
  ],
  goals: [
    {
      id: 'goal_daily_1',
      userId: 'usr_alex_chen',
      title: 'Daily Deep Study Hours',
      description: 'Accumulate minimum 3.5 hours of deliberate study.',
      goalType: 'daily',
      targetValue: 4,
      currentValue: 3.5,
      unit: 'hours',
      status: 'active',
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
    },
  ],
  plans: [] as any[],
};

function isMongoLive(): boolean {
  return mongoose.connection.readyState === 1;
}

// --- Health & Connection Check ---
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const status = getDatabaseStatus();
  res.json({
    ok: true,
    mongo: status,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.post('/db/retry', async (_req: Request, res: Response) => {
  const result = await connectToDatabase();
  const status = getDatabaseStatus();
  res.json({
    ok: result.isConnected,
    mongo: status,
  });
});

function sanitizeUser(user: any) {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.passwordSalt;
  delete obj.__v;
  delete obj._id;
  return obj;
}

// --- Basic Authentication System ---

// 1. Register with username & password
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, studyField } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Check duplicate username
    if (isMongoLive()) {
      const existingMongo = await UserModel.findOne({ username: cleanUsername });
      if (existingMongo) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }
    const existingMem = memoryStore.users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (existingMem) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${cleanUsername}_${Date.now().toString(36)}`;
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanUsername;
    const field = (studyField && typeof studyField === 'string' && studyField.trim()) ? studyField.trim() : 'General Studies';

    const defaultPreferences = {
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
    };

    const newUserDoc = {
      id: userId,
      username: cleanUsername,
      passwordSalt: salt,
      passwordHash,
      name: displayName,
      email: `${cleanUsername}@focusflow.app`,
      studyField: field,
      preferences: defaultPreferences,
      createdAt: new Date().toISOString(),
    };

    memoryStore.users.push(newUserDoc as any);

    // Initial Starter Goals for this user
    const initialGoals = [
      {
        id: `goal_${userId}_daily`,
        userId,
        title: 'Daily Deep Study Hours',
        description: 'Consistent deliberate study time.',
        goalType: 'daily',
        targetValue: 4,
        currentValue: 0,
        unit: 'hours',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: `goal_${userId}_weekly`,
        userId,
        title: 'Weekly Study Target',
        description: 'Weekly deep focus milestone.',
        goalType: 'weekly',
        targetValue: 20,
        currentValue: 0,
        unit: 'hours',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
    memoryStore.goals.push(...initialGoals as any);

    if (isMongoLive()) {
      try {
        const createdMongoUser = await UserModel.create(newUserDoc);
        await GoalModel.insertMany(initialGoals);
        return res.status(201).json({
          ok: true,
          user: sanitizeUser(createdMongoUser),
          message: 'Account created successfully',
        });
      } catch (err: any) {
        console.warn('[MongoDB Auth] Save error:', err.message);
      }
    }

    res.status(201).json({
      ok: true,
      user: sanitizeUser(newUserDoc),
      message: 'Account created successfully',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login with username & password
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();

    let targetUser: any = null;

    if (isMongoLive()) {
      try {
        targetUser = await UserModel.findOne({
          $or: [
            { username: cleanUsername },
            { id: `usr_${cleanUsername}` },
            { email: cleanUsername },
          ],
        }).lean();
      } catch (err: any) {
        console.warn('[MongoDB Auth] Lookup error:', err.message);
      }
    }

    if (!targetUser) {
      targetUser = memoryStore.users.find(
        u => u.username?.toLowerCase() === cleanUsername || u.id === cleanUsername
      );
    }

    if (!targetUser) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify Password
    let passwordMatches = false;
    if (targetUser.passwordSalt && targetUser.passwordHash) {
      passwordMatches = verifyPassword(password, targetUser.passwordSalt, targetUser.passwordHash);
    } else {
      // Legacy seed fallback
      passwordMatches = password === 'focus123';
    }

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      ok: true,
      user: sanitizeUser(targetUser),
      message: `Welcome back, ${targetUser.name}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. List Available Accounts (For easy multi-user switching)
apiRouter.get('/auth/users', async (_req: Request, res: Response) => {
  try {
    let usersList: any[] = [];
    if (isMongoLive()) {
      try {
        usersList = await UserModel.find().select('id username name studyField email preferences.theme').lean();
      } catch {
        usersList = memoryStore.users;
      }
    } else {
      usersList = memoryStore.users;
    }

    const sanitized = usersList.map(u => ({
      id: u.id,
      username: u.username || (u.id === 'usr_alex_chen' ? 'alex' : u.name.toLowerCase().replace(/\s+/g, '_')),
      name: u.name,
      studyField: u.studyField,
      email: u.email,
    }));

    res.json({ ok: true, users: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Users CRUD ---
apiRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    if (isMongoLive()) {
      const users = await UserModel.find().lean();
      return res.json(users);
    }
    res.json(memoryStore.users);
  } catch {
    res.json(memoryStore.users);
  }
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, email, studyField } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const cleanUsername = (req.body.username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const salt = generateSalt();
    const userData = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      passwordSalt: salt,
      passwordHash: hashPassword(req.body.password || 'focus123', salt),
      name: name.trim(),
      email: email.trim(),
      studyField: (studyField || 'General Studies').trim(),
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
      createdAt: new Date().toISOString(),
    };

    memoryStore.users.push(userData);

    if (isMongoLive()) {
      try {
        const newUser = await UserModel.create(userData);
        return res.status(201).json(newUser);
      } catch (err: any) {
        console.warn('[MongoDB] Save user failed, returning cached:', err.message);
      }
    }

    res.status(201).json(userData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, studyField } = req.body;
    const userIndex = memoryStore.users.findIndex(u => u.id === req.params.id);
    if (userIndex >= 0) {
      if (name) memoryStore.users[userIndex].name = name;
      if (studyField) memoryStore.users[userIndex].studyField = studyField;
    }

    if (isMongoLive()) {
      try {
        const user = await UserModel.findOneAndUpdate(
          { id: req.params.id },
          { $set: { name, studyField } },
          { new: true }
        );
        if (user) return res.json(user);
      } catch (err: any) {
        console.warn('[MongoDB] Update user fallback:', err.message);
      }
    }

    if (userIndex >= 0) return res.json(memoryStore.users[userIndex]);
    return res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id/preferences', async (req: Request, res: Response) => {
  try {
    const user = memoryStore.users.find(u => u.id === req.params.id);
    if (user) {
      user.preferences = { ...user.preferences, ...req.body };
    }

    if (isMongoLive()) {
      try {
        const mongoUser = await UserModel.findOne({ id: req.params.id });
        if (mongoUser) {
          mongoUser.preferences = { ...mongoUser.preferences, ...req.body };
          await mongoUser.save();
          return res.json(mongoUser.preferences);
        }
      } catch (err: any) {
        console.warn('[MongoDB] Preferences fallback:', err.message);
      }
    }

    if (user) return res.json(user.preferences);
    return res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users/:id/reset', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (isMongoLive()) {
      try {
        await StudySessionModel.deleteMany({ userId });
        await GoalModel.deleteMany({ userId });
      } catch (err: any) {
        console.warn('[MongoDB] Reset delete failed:', err.message);
      }
    }

    res.json({ ok: true, message: 'Data reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Study Sessions CRUD ---
apiRouter.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (isMongoLive()) {
      try {
        const filter = userId ? { userId } : {};
        const sessions = await StudySessionModel.find(filter)
          .sort({ sessionDate: -1 })
          .lean();
        return res.json(sessions);
      } catch (err: any) {
        console.warn('[MongoDB] Fetch sessions fallback:', err.message);
      }
    }

    const filtered = userId
      ? memoryStore.sessions.filter(s => s.userId === userId)
      : memoryStore.sessions;
    res.json(filtered.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    if (isMongoLive()) {
      try {
        const session = await StudySessionModel.findOne({ id: req.params.id }).lean();
        if (session) return res.json(session);
      } catch (err: any) {
        console.warn('[MongoDB] Get session fallback:', err.message);
      }
    }

    const session = memoryStore.sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/sessions', async (req: Request, res: Response) => {
  try {
    const sessionData = req.body;
    if (!sessionData.title || !sessionData.userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }

    const sessionId = sessionData.id || `session_${Date.now()}`;
    const normalizedSession = {
      ...sessionData,
      id: sessionId,
      sessionDate: sessionData.sessionDate ? new Date(sessionData.sessionDate) : new Date(),
    };

    // Update memoryStore
    const existingIndex = memoryStore.sessions.findIndex(s => s.id === sessionId);
    if (existingIndex >= 0) {
      memoryStore.sessions[existingIndex] = normalizedSession;
    } else {
      memoryStore.sessions.unshift(normalizedSession);
    }

    // Sync memoryStore goals
    if (normalizedSession.status === 'completed' && normalizedSession.actualDuration > 0) {
      for (const g of memoryStore.goals.filter(goal => goal.userId === normalizedSession.userId && goal.status === 'active')) {
        if (g.unit === 'hours') {
          g.currentValue = Math.round((g.currentValue + normalizedSession.actualDuration / 60) * 10) / 10;
          if (g.currentValue >= g.targetValue) g.status = 'completed';
        } else if (g.unit === 'sessions') {
          g.currentValue += 1;
          if (g.currentValue >= g.targetValue) g.status = 'completed';
        }
      }
    }

    // Write to MongoDB if live
    if (isMongoLive()) {
      try {
        const newSession = await StudySessionModel.findOneAndUpdate(
          { id: sessionId },
          { ...normalizedSession },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (newSession.status === 'completed' && newSession.actualDuration > 0) {
          const activeGoals = await GoalModel.find({ userId: newSession.userId, status: 'active' });
          for (const goal of activeGoals) {
            let changed = false;
            if (goal.unit === 'hours') {
              goal.currentValue = Math.round((goal.currentValue + newSession.actualDuration / 60) * 10) / 10;
              if (goal.currentValue >= goal.targetValue) goal.status = 'completed';
              changed = true;
            } else if (goal.unit === 'sessions') {
              goal.currentValue += 1;
              if (goal.currentValue >= goal.targetValue) goal.status = 'completed';
              changed = true;
            }
            if (changed) await goal.save();
          }
        }

        return res.status(201).json(newSession);
      } catch (err: any) {
        console.warn('[MongoDB] Save session fallback:', err.message);
      }
    }

    res.status(201).json(normalizedSession);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const idx = memoryStore.sessions.findIndex(s => s.id === req.params.id);
    if (idx >= 0) {
      memoryStore.sessions[idx] = { ...memoryStore.sessions[idx], ...req.body };
    }

    if (isMongoLive()) {
      try {
        const updated = await StudySessionModel.findOneAndUpdate(
          { id: req.params.id },
          { $set: req.body },
          { new: true }
        );
        if (updated) return res.json(updated);
      } catch (err: any) {
        console.warn('[MongoDB] Update session fallback:', err.message);
      }
    }

    if (idx >= 0) return res.json(memoryStore.sessions[idx]);
    return res.status(404).json({ error: 'Session not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const prev = memoryStore.sessions.length;
    memoryStore.sessions = memoryStore.sessions.filter(s => s.id !== req.params.id);

    if (isMongoLive()) {
      try {
        await StudySessionModel.deleteOne({ id: req.params.id });
      } catch (err: any) {
        console.warn('[MongoDB] Delete session fallback:', err.message);
      }
    }

    res.json({ ok: true, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Goals CRUD ---
apiRouter.get('/goals', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (isMongoLive()) {
      try {
        const filter = userId ? { userId } : {};
        const goals = await GoalModel.find(filter).sort({ createdAt: -1 }).lean();
        return res.json(goals);
      } catch (err: any) {
        console.warn('[MongoDB] Get goals fallback:', err.message);
      }
    }

    const filtered = userId
      ? memoryStore.goals.filter(g => g.userId === userId)
      : memoryStore.goals;
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/goals', async (req: Request, res: Response) => {
  try {
    const goalData = req.body;
    if (!goalData.title || !goalData.userId || goalData.targetValue === undefined) {
      return res.status(400).json({ error: 'Title, userId, and targetValue are required' });
    }

    const goalId = goalData.id || `goal_${Date.now()}`;
    const normalizedGoal = {
      ...goalData,
      id: goalId,
      createdAt: goalData.createdAt || new Date().toISOString(),
    };

    const existingIdx = memoryStore.goals.findIndex(g => g.id === goalId);
    if (existingIdx >= 0) {
      memoryStore.goals[existingIdx] = normalizedGoal;
    } else {
      memoryStore.goals.push(normalizedGoal);
    }

    if (isMongoLive()) {
      try {
        const newGoal = await GoalModel.findOneAndUpdate(
          { id: goalId },
          { ...normalizedGoal, id: goalId },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.status(201).json(newGoal);
      } catch (err: any) {
        console.warn('[MongoDB] Save goal fallback:', err.message);
      }
    }

    res.status(201).json(normalizedGoal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/goals/:id', async (req: Request, res: Response) => {
  try {
    const idx = memoryStore.goals.findIndex(g => g.id === req.params.id);
    if (idx >= 0) {
      memoryStore.goals[idx] = { ...memoryStore.goals[idx], ...req.body };
    }

    if (isMongoLive()) {
      try {
        const updated = await GoalModel.findOneAndUpdate(
          { id: req.params.id },
          { $set: req.body },
          { new: true }
        );
        if (updated) return res.json(updated);
      } catch (err: any) {
        console.warn('[MongoDB] Update goal fallback:', err.message);
      }
    }

    if (idx >= 0) return res.json(memoryStore.goals[idx]);
    return res.status(404).json({ error: 'Goal not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/goals/:id', async (req: Request, res: Response) => {
  try {
    memoryStore.goals = memoryStore.goals.filter(g => g.id !== req.params.id);

    if (isMongoLive()) {
      try {
        await GoalModel.deleteOne({ id: req.params.id });
      } catch (err: any) {
        console.warn('[MongoDB] Delete goal fallback:', err.message);
      }
    }

    res.json({ ok: true, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// NEXT DAY PLANNER API ROUTES
// ==========================================

// 1. Get daily plan by date
apiRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const date = req.query.date as string;

    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    if (isMongoLive()) {
      try {
        const plan = await DailyPlanModel.findOne({ userId, date }).lean();
        if (plan) return res.json({ ok: true, plan });
      } catch (err: any) {
        console.warn('[MongoDB] Get plan fallback:', err.message);
      }
    }

    const cached = memoryStore.plans.find(p => p.userId === userId && p.date === date);
    return res.json({ ok: true, plan: cached || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get daily plans across a date range (for week and month views)
apiRouter.get('/plans/range', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: 'userId, startDate, and endDate are required' });
    }

    if (isMongoLive()) {
      try {
        const plans = await DailyPlanModel.find({
          userId,
          date: { $gte: startDate, $lte: endDate },
        })
          .sort({ date: 1 })
          .lean();
        return res.json({ ok: true, plans });
      } catch (err: any) {
        console.warn('[MongoDB] Get plans range fallback:', err.message);
      }
    }

    const cached = memoryStore.plans.filter(
      p => p.userId === userId && p.date >= startDate && p.date <= endDate
    );
    return res.json({ ok: true, plans: cached });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Upsert daily plan
apiRouter.post('/plans', async (req: Request, res: Response) => {
  try {
    const planData = req.body;
    if (!planData || !planData.userId || !planData.date) {
      return res.status(400).json({ error: 'userId and date are required in plan payload' });
    }

    if (!planData.id) {
      planData.id = `plan_${planData.userId}_${planData.date}`;
    }
    planData.updatedAt = new Date().toISOString();

    // Memory store update
    const memIdx = memoryStore.plans.findIndex(
      p => (p.id && p.id === planData.id) || (p.userId === planData.userId && p.date === planData.date)
    );
    if (memIdx >= 0) {
      memoryStore.plans[memIdx] = planData;
    } else {
      memoryStore.plans.push(planData);
    }

    if (isMongoLive()) {
      try {
        const updated = await DailyPlanModel.findOneAndUpdate(
          { userId: planData.userId, date: planData.date },
          { $set: planData },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        return res.json({ ok: true, plan: updated });
      } catch (err: any) {
        console.warn('[MongoDB] Save plan fallback:', err.message);
      }
    }

    return res.json({ ok: true, plan: planData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete daily plan
apiRouter.delete('/plans/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    memoryStore.plans = memoryStore.plans.filter(p => p.id !== id);

    if (isMongoLive()) {
      try {
        await DailyPlanModel.deleteOne({ id });
      } catch (err: any) {
        console.warn('[MongoDB] Delete plan fallback:', err.message);
      }
    }

    return res.json({ ok: true, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Add or update activity inside a plan
apiRouter.post('/plans/:id/activities', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = req.body;

    if (!activity || !activity.id) {
      return res.status(400).json({ error: 'Activity with id is required' });
    }

    // Update in memoryStore
    const plan = memoryStore.plans.find(p => p.id === id);
    if (plan) {
      plan.activities = plan.activities || [];
      const actIdx = plan.activities.findIndex((a: any) => a.id === activity.id);
      if (actIdx >= 0) {
        plan.activities[actIdx] = activity;
      } else {
        plan.activities.push(activity);
      }
      plan.updatedAt = new Date().toISOString();
    }

    if (isMongoLive()) {
      try {
        const dbPlan = await DailyPlanModel.findOne({ id });
        if (dbPlan) {
          const acts = dbPlan.activities || [];
          const actIdx = acts.findIndex((a: any) => a.id === activity.id);
          if (actIdx >= 0) {
            acts[actIdx] = activity;
          } else {
            acts.push(activity);
          }
          dbPlan.activities = acts;
          dbPlan.markModified('activities');
          await dbPlan.save();
          return res.json({ ok: true, activity, plan: dbPlan });
        }
      } catch (err: any) {
        console.warn('[MongoDB] Add activity fallback:', err.message);
      }
    }

    return res.json({ ok: true, activity, plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete an activity from a plan
apiRouter.delete('/plans/:planId/activities/:activityId', async (req: Request, res: Response) => {
  try {
    const { planId, activityId } = req.params;

    const plan = memoryStore.plans.find(p => p.id === planId);
    if (plan && plan.activities) {
      plan.activities = plan.activities.filter((a: any) => a.id !== activityId);
      plan.updatedAt = new Date().toISOString();
    }

    if (isMongoLive()) {
      try {
        await DailyPlanModel.updateOne(
          { id: planId },
          { $pull: { activities: { id: activityId } } }
        );
      } catch (err: any) {
        console.warn('[MongoDB] Delete activity fallback:', err.message);
      }
    }

    return res.json({ ok: true, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Save daily review
apiRouter.post('/plans/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dailyReview } = req.body;

    const plan = memoryStore.plans.find(p => p.id === id);
    if (plan) {
      plan.dailyReview = dailyReview;
      plan.status = 'reviewed';
      plan.updatedAt = new Date().toISOString();
    }

    if (isMongoLive()) {
      try {
        const updated = await DailyPlanModel.findOneAndUpdate(
          { id },
          { $set: { dailyReview, status: 'reviewed' } },
          { new: true }
        ).lean();
        return res.json({ ok: true, plan: updated });
      } catch (err: any) {
        console.warn('[MongoDB] Save daily review fallback:', err.message);
      }
    }

    return res.json({ ok: true, plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Synchronize completed study session with linked planner activity
apiRouter.post('/plans/sync-session', async (req: Request, res: Response) => {
  try {
    const { linkedActivityId, sessionId } = req.body;
    if (!linkedActivityId) {
      return res.status(400).json({ error: 'linkedActivityId is required' });
    }

    // Update in memory
    for (const plan of memoryStore.plans) {
      if (plan.activities) {
        const act = plan.activities.find((a: any) => a.id === linkedActivityId);
        if (act) {
          act.status = 'completed';
          act.linkedSessionId = sessionId;
        }
      }
      if (plan.topPriorities) {
        const pri = plan.topPriorities.find((p: any) => p.linkedActivityId === linkedActivityId);
        if (pri) pri.completed = true;
      }
    }

    if (isMongoLive()) {
      try {
        await DailyPlanModel.updateMany(
          { 'activities.id': linkedActivityId },
          {
            $set: {
              'activities.$.status': 'completed',
              'activities.$.linkedSessionId': sessionId,
            },
          }
        );
      } catch (err: any) {
        console.warn('[MongoDB] Sync session fallback:', err.message);
      }
    }

    return res.json({ ok: true, synchronized: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
