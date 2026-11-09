/**
 * FocusFlow Data Storage & MongoDB Sync Service.
 * Coordinates client-side caching with real MongoDB REST API endpoints.
 */

import {
  StudySession,
  Goal,
  User,
  UserPreferences,
  DailyPlan,
  PlannerActivity,
  DailyReview,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'focusflow_users_v1',
  CURRENT_USER_ID: 'focusflow_current_user_id_v1',
  SESSIONS: 'focusflow_sessions_v1',
  GOALS: 'focusflow_goals_v1',
  PLANS: 'focusflow_plans_v1',
  MONGO_STATUS: 'focusflow_mongo_status_v1',
};

const DEFAULT_PREFERENCES: UserPreferences = {
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

const DEFAULT_USER: User = {
  id: 'usr_alex_chen',
  username: 'alex',
  name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  studyField: 'Computer Science & Cognitive Psychology',
  preferences: DEFAULT_PREFERENCES,
  createdAt: '2026-10-15T08:00:00.000Z',
};

const DEFAULT_USER_SARAH: User = {
  id: 'usr_sarah_connor',
  username: 'sarah',
  name: 'Sarah Connor',
  email: 'sarah.connor@university.edu',
  studyField: 'Cybernetics & Robotics',
  preferences: {
    ...DEFAULT_PREFERENCES,
    defaultPomodoroWork: 50,
    defaultPomodoroBreak: 10,
    theme: 'dark',
  },
  createdAt: '2026-10-20T08:00:00.000Z',
};

export interface MongoStatus {
  state: 'connected' | 'connecting' | 'disconnected' | 'unknown';
  isConnected: boolean;
  databaseName: string;
  host: string;
  error?: string | null;
}

class StorageService {
  private users: User[] = [];
  private currentUserId: string = DEFAULT_USER.id;
  private sessions: StudySession[] = [];
  private goals: Goal[] = [];
  private plans: DailyPlan[] = [];
  private status: MongoStatus = {
    state: 'connecting',
    isConnected: false,
    databaseName: 'FocusFlow',
    host: 'cluster0.kyfjixo.mongodb.net',
  };
  private statusListeners: Array<(status: MongoStatus) => void> = [];
  private dataListeners: Array<() => void> = [];

  constructor() {
    this.initLocal();
    if (typeof window !== 'undefined') {
      // Connect and sync with MongoDB backend
      this.syncWithBackend();
    }
  }

  private initLocal(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = [DEFAULT_USER];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      }

      const storedCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedCurrentId && this.users.some(u => u.id === storedCurrentId)) {
        this.currentUserId = storedCurrentId;
      } else {
        this.currentUserId = DEFAULT_USER.id;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      }

      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (storedSessions) {
        this.sessions = JSON.parse(storedSessions);
      }

      const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (storedGoals) {
        this.goals = JSON.parse(storedGoals);
      }

      const storedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (storedPlans) {
        this.plans = JSON.parse(storedPlans);
      }
    } catch {
      this.users = [DEFAULT_USER];
      this.currentUserId = DEFAULT_USER.id;
    }
  }

  /**
   * Syncs initial state with MongoDB backend API.
   */
  public async syncWithBackend(): Promise<void> {
    try {
      // 1. Check MongoDB Health
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        if (data.mongo) {
          this.status = {
            state: data.mongo.state,
            isConnected: data.mongo.isConnected,
            databaseName: data.mongo.databaseName || 'FocusFlow',
            host: data.mongo.host || 'cluster0.kyfjixo.mongodb.net',
            error: data.mongo.error,
          };
          this.notifyStatusListeners();
        }
      }

      // 2. Fetch Users from MongoDB
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const remoteUsers: User[] = await usersRes.json();
        if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          this.users = remoteUsers;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
        }
      }

      // 3. Fetch Sessions from MongoDB for current user
      const sessionsRes = await fetch(`/api/sessions?userId=${this.currentUserId}`);
      if (sessionsRes.ok) {
        const remoteSessions: StudySession[] = await sessionsRes.json();
        if (Array.isArray(remoteSessions) && remoteSessions.length > 0) {
          this.sessions = remoteSessions;
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
        }
      }

      // 4. Fetch Goals from MongoDB for current user
      const goalsRes = await fetch(`/api/goals?userId=${this.currentUserId}`);
      if (goalsRes.ok) {
        const remoteGoals: Goal[] = await goalsRes.json();
        if (Array.isArray(remoteGoals) && remoteGoals.length > 0) {
          this.goals = remoteGoals;
          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
        }
      }

      // 5. Fetch Plans from MongoDB for current user
      const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
      const plansRes = await fetch(
        `/api/plans/range?userId=${this.currentUserId}&startDate=${startDate}&endDate=${endDate}`
      );
      if (plansRes.ok) {
        const data = await plansRes.json();
        if (data && Array.isArray(data.plans) && data.plans.length > 0) {
          this.plans = data.plans;
          localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
        }
      }

      this.notifyDataChange();
    } catch (err) {
      console.warn('[MongoDB Sync] Backend sync note (using local cache):', err);
    }
  }

  public subscribeStatus(listener: (status: MongoStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }

  public subscribeData(listener: () => void): () => void {
    this.dataListeners.push(listener);
    return () => {
      this.dataListeners = this.dataListeners.filter(l => l !== listener);
    };
  }

  public notifyDataChange(): void {
    for (const listener of this.dataListeners) {
      try {
        listener();
      } catch (err) {
        console.error('Data listener error:', err);
      }
    }
  }

  public getStatus(): MongoStatus {
    return this.status;
  }

  // --- Authentication System ---
  public async login(username: string, password: string): Promise<{ ok: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Authentication failed' };
      }

      const user: User = data.user;
      this.upsertUser(user);
      this.setCurrentUser(user.id, user);
      await this.syncWithBackend();

      return { ok: true, user };
    } catch {
      // Local fallback for demo credentials
      const cleanUser = username.trim().toLowerCase();
      let matched = this.users.find(u => u.username?.toLowerCase() === cleanUser || u.id === `usr_${cleanUser}`);
      if (!matched && cleanUser === 'alex') matched = DEFAULT_USER;
      if (!matched && cleanUser === 'sarah') matched = DEFAULT_USER_SARAH;

      if (matched && password === 'focus123') {
        this.upsertUser(matched);
        this.setCurrentUser(matched.id, matched);
        return { ok: true, user: matched };
      }
      return { ok: false, error: 'Invalid username or password' };
    }
  }

  public async register(
    username: string,
    password: string,
    name?: string,
    studyField?: string
  ): Promise<{ ok: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, studyField }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Registration failed' };
      }

      const user: User = data.user;
      this.upsertUser(user);
      this.setCurrentUser(user.id, user);
      await this.syncWithBackend();

      return { ok: true, user };
    } catch {
      // Local fallback creation
      const cleanUser = username.trim().toLowerCase();
      const newUser: User = {
        id: `usr_${cleanUser}_${Date.now().toString(36)}`,
        username: cleanUser,
        name: name || cleanUser,
        email: `${cleanUser}@focusflow.app`,
        studyField: studyField || 'General Studies',
        preferences: { ...DEFAULT_PREFERENCES },
        createdAt: new Date().toISOString(),
      };
      this.upsertUser(newUser);
      this.setCurrentUser(newUser.id, newUser);
      return { ok: true, user: newUser };
    }
  }

  public async fetchAvailableAccounts(): Promise<Array<{ id: string; username: string; name: string; studyField: string }>> {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          return data.users;
        }
      }
    } catch (err) {
      console.warn('Accounts fetch warning:', err);
    }
    return this.users.map(u => ({
      id: u.id,
      username: u.username || 'user',
      name: u.name,
      studyField: u.studyField,
    }));
  }

  public logout(): void {
    // When logged out, keep demo user or clear current
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.currentUserId = '';
  }

  private upsertUser(user: User): void {
    const idx = this.users.findIndex(u => u.id === user.id || u.username === user.username);
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...user };
    } else {
      this.users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
  }

  // --- Users CRUD ---
  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    return user || this.users[0] || DEFAULT_USER;
  }

  public getCurrentUserId(): string {
    return this.currentUserId || this.getCurrentUser().id;
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public setCurrentUser(userId: string, explicitUser?: User): User {
    if (explicitUser) {
      this.upsertUser(explicitUser);
      this.currentUserId = explicitUser.id;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, explicitUser.id);
      this.syncWithBackend();
      return explicitUser;
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUserId = userId;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      // Fetch user's data from MongoDB in background
      this.syncWithBackend();
      return user;
    }
    return this.getCurrentUser();
  }

  public updateUser(user: User): User {
    this.users = this.users.map(u => (u.id === user.id ? user : u));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));

    // Persist to MongoDB
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, studyField: user.studyField }),
    }).catch(err => console.error('[MongoDB Error] Update user:', err));

    return user;
  }

  public updatePreferences(userId: string, prefs: Partial<UserPreferences>): UserPreferences {
    const user = this.users.find(u => u.id === userId);
    if (!user) return DEFAULT_PREFERENCES;
    user.preferences = { ...user.preferences, ...prefs };
    this.updateUser(user);

    // Persist to MongoDB
    fetch(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }).catch(err => console.error('[MongoDB Error] Update preferences:', err));

    return user.preferences;
  }

  // --- Study Sessions CRUD ---
  public getSessions(userId?: string): StudySession[] {
    const targetId = userId || this.currentUserId;
    return this.sessions
      .filter(s => s.userId === targetId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }

  public getSessionById(id: string): StudySession | undefined {
    return this.sessions.find(s => s.id === id);
  }

  public saveSession(session: StudySession): StudySession {
    const index = this.sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      this.sessions[index] = { ...session, updatedAt: new Date().toISOString() };
    } else {
      this.sessions.unshift({
        ...session,
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
    this.syncGoalsLocally(session);
    this.notifyDataChange();

    // Actionable write to MongoDB
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
      .then(res => res.json())
      .then(() => {
        // Refresh goals from backend in case server updated them
        this.syncWithBackend();
      })
      .catch(err => console.error('[MongoDB Error] Save session:', err));

    return session;
  }

  public deleteSession(id: string): boolean {
    const prevLen = this.sessions.length;
    this.sessions = this.sessions.filter(s => s.id !== id);
    if (this.sessions.length !== prevLen) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
      this.notifyDataChange();

      // Actionable delete from MongoDB
      fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      }).catch(err => console.error('[MongoDB Error] Delete session:', err));

      return true;
    }
    return false;
  }

  // --- Goals CRUD ---
  public getGoals(userId?: string): Goal[] {
    const targetId = userId || this.currentUserId;
    return this.goals.filter(g => g.userId === targetId);
  }

  public saveGoal(goal: Goal): Goal {
    const index = this.goals.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      this.goals[index] = goal;
    } else {
      this.goals.push(goal);
    }
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    this.notifyDataChange();

    // Actionable write to MongoDB
    fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    }).catch(err => console.error('[MongoDB Error] Save goal:', err));

    return goal;
  }

  public deleteGoal(id: string): boolean {
    const prevLen = this.goals.length;
    this.goals = this.goals.filter(g => g.id !== id);
    if (this.goals.length !== prevLen) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
      this.notifyDataChange();

      // Actionable delete from MongoDB
      fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      }).catch(err => console.error('[MongoDB Error] Delete goal:', err));

      return true;
    }
    return false;
  }

  private syncGoalsLocally(session: StudySession): void {
    if (session.status !== 'completed' || session.actualDuration <= 0) return;

    const userGoals = this.goals.filter(g => g.userId === session.userId && g.status === 'active');
    let changed = false;

    for (const goal of userGoals) {
      if (goal.unit === 'hours') {
        goal.currentValue = Math.round((goal.currentValue + session.actualDuration / 60) * 10) / 10;
        if (goal.currentValue >= goal.targetValue) goal.status = 'completed';
        changed = true;
      } else if (goal.unit === 'sessions') {
        goal.currentValue += 1;
        if (goal.currentValue >= goal.targetValue) goal.status = 'completed';
        changed = true;
      } else if (goal.unit === 'targets') {
        const completedTargetsCount = session.targets?.filter(t => t.completed).length || 0;
        if (completedTargetsCount > 0) {
          goal.currentValue += completedTargetsCount;
          if (goal.currentValue >= goal.targetValue) goal.status = 'completed';
          changed = true;
        }
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    }
  }

  public resetDemoData(userId: string): void {
    // Actionable reset in MongoDB
    fetch(`/api/users/${userId}/reset`, {
      method: 'POST',
    })
      .then(() => this.syncWithBackend())
      .catch(err => console.error('[MongoDB Error] Reset data:', err));
  }

  // ==========================================
  // NEXT DAY PLANNER CRUD METHODS
  // ==========================================

  public getDailyPlan(date: string, userId?: string): DailyPlan | null {
    const targetUserId = userId || this.currentUserId;
    const found = this.plans.find(p => p.userId === targetUserId && p.date === date);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  public getDailyPlansRange(startDate: string, endDate: string, userId?: string): DailyPlan[] {
    const targetUserId = userId || this.currentUserId;
    return this.plans
      .filter(p => p.userId === targetUserId && p.date >= startDate && p.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public saveDailyPlan(plan: DailyPlan): DailyPlan {
    const updatedPlan: DailyPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };

    const index = this.plans.findIndex(
      p => (p.id && p.id === plan.id) || (p.userId === plan.userId && p.date === plan.date)
    );

    if (index >= 0) {
      this.plans[index] = updatedPlan;
    } else {
      this.plans.push(updatedPlan);
    }

    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
    this.notifyDataChange();

    // Persist to MongoDB API
    fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlan),
    }).catch(err => console.error('[MongoDB Error] Save plan:', err));

    return updatedPlan;
  }

  public deleteDailyPlan(id: string): boolean {
    const prevLen = this.plans.length;
    this.plans = this.plans.filter(p => p.id !== id);

    if (this.plans.length !== prevLen) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
      this.notifyDataChange();

      fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      }).catch(err => console.error('[MongoDB Error] Delete plan:', err));

      return true;
    }
    return false;
  }

  public saveActivity(activity: PlannerActivity): PlannerActivity {
    let plan = this.getDailyPlan(activity.date, activity.userId);

    if (!plan) {
      plan = {
        id: `plan_${activity.userId}_${activity.date}`,
        userId: activity.userId,
        date: activity.date,
        title: `Schedule for ${activity.date}`,
        topPriorities: [],
        secondaryTasks: [],
        activities: [activity],
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      plan.activities = plan.activities || [];
      const actIdx = plan.activities.findIndex(a => a.id === activity.id);
      if (actIdx >= 0) {
        plan.activities[actIdx] = activity;
      } else {
        plan.activities.push(activity);
      }
      // Sort activities chronologically by startTime
      plan.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    this.saveDailyPlan(plan);
    return activity;
  }

  public deleteActivity(planDate: string, activityId: string): boolean {
    const plan = this.getDailyPlan(planDate, this.currentUserId);
    if (!plan) return false;

    const prevCount = plan.activities?.length || 0;
    plan.activities = (plan.activities || []).filter(a => a.id !== activityId);

    // Also update any top priorities linked to this activity
    if (plan.topPriorities) {
      plan.topPriorities = plan.topPriorities.map(p =>
        p.linkedActivityId === activityId ? { ...p, linkedActivityId: undefined } : p
      );
    }

    if (plan.activities.length !== prevCount) {
      this.saveDailyPlan(plan);

      fetch(`/api/plans/${plan.id}/activities/${activityId}`, {
        method: 'DELETE',
      }).catch(err => console.error('[MongoDB Error] Delete activity:', err));

      return true;
    }
    return false;
  }

  public saveDailyReview(date: string, review: DailyReview, userId?: string): DailyPlan {
    const targetUserId = userId || this.currentUserId;
    let plan = this.getDailyPlan(date, targetUserId);

    if (!plan) {
      plan = {
        id: `plan_${targetUserId}_${date}`,
        userId: targetUserId,
        date,
        title: `Plan for ${date}`,
        topPriorities: [],
        secondaryTasks: [],
        activities: [],
        dailyReview: review,
        status: 'reviewed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      plan.dailyReview = review;
      plan.status = 'reviewed';
    }

    this.saveDailyPlan(plan);

    fetch(`/api/plans/${plan.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyReview: review }),
    }).catch(err => console.error('[MongoDB Error] Save daily review:', err));

    return plan;
  }

  public markActivityCompleted(activityId: string, linkedSessionId?: string): void {
    let modified = false;

    for (const plan of this.plans) {
      if (plan.activities) {
        const act = plan.activities.find(a => a.id === activityId);
        if (act) {
          act.status = 'completed';
          if (linkedSessionId) act.linkedSessionId = linkedSessionId;
          modified = true;
        }
      }
      if (plan.topPriorities) {
        const pri = plan.topPriorities.find(p => p.linkedActivityId === activityId);
        if (pri) {
          pri.completed = true;
          modified = true;
        }
      }
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
      this.notifyDataChange();

      fetch('/api/plans/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedActivityId: activityId, sessionId: linkedSessionId }),
      }).catch(err => console.error('[MongoDB Error] Sync session:', err));
    }
  }
}

export const db = new StorageService();
