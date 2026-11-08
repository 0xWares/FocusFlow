/**
 * FocusFlow Study Session State Machine & Timer Context.
 * Manages the entire 3-phase study session workflow:
 * Phase 1: Preparation (5 checkpoints)
 * Phase 2: Performance (Mental technique -> Bliss Station active timer)
 * Phase 3: Preservation (Notes, organize, breathing, gratitude, evaluation)
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  StudySession,
  SessionPhase,
  TimeBlockType,
  ChecklistItem,
  StudyTarget,
  PerformanceTechnique,
  SessionNotes,
  ClosingData,
} from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/db';
import { soundEngine } from '../utils/audio';
import { calculateAverageScore } from '../utils/sessionMath';

interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'break';
  timerPhase: 'focus' | 'break';
  currentCycle: number;
  totalCycles: number;
  remainingSeconds: number;
  targetFocusSeconds: number;
  targetBreakSeconds: number;
  elapsedFocusSeconds: number;
  elapsedBreakSeconds: number;
  startTimestamp: number | null;
}

interface SessionContextType {
  // Current workflow state
  isSessionActive: boolean;
  activePhase: SessionPhase;
  currentPrepStep: number; // 1 to 5
  sessionDraft: Partial<StudySession> | null;
  timer: TimerState;

  // Workflow actions
  initNewSession: (
    initialTitle?: string,
    initialSubject?: string,
    plannerConfig?: {
      linkedActivityId?: string;
      plannedDuration?: number;
      timeBlockType?: TimeBlockType;
      intention?: string;
      targets?: StudyTarget[];
      pomodoroWork?: number;
      pomodoroBreak?: number;
      ultradianWork?: number;
      ultradianBreak?: number;
      preferredTechniques?: PerformanceTechnique[];
    }
  ) => void;
  setPrepStep: (step: number) => void;
  updateSessionDraft: (updater: (prev: Partial<StudySession>) => Partial<StudySession>) => void;
  completePreparation: () => void;
  selectPerformanceTechnique: (technique: PerformanceTechnique) => void;
  enterBlissStation: () => void;

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipToBreak: () => void;
  skipToFocus: () => void;
  toggleTargetCompleted: (targetId: string) => void;

  // Preservation actions
  endSessionToPreservation: () => void;
  completeAndSaveSession: () => StudySession | null;
  cancelActiveSession: () => void;

  // Ambient sound state
  ambientSound: 'none' | 'rain' | 'stream' | 'white-noise';
  setAmbientSound: (sound: 'none' | 'rain' | 'stream' | 'white-noise') => void;
}

const LOCAL_STORAGE_ACTIVE_SESSION = 'focusflow_active_session_state_v1';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [activePhase, setActivePhase] = useState<SessionPhase>('preparation');
  const [currentPrepStep, setCurrentPrepStep] = useState<number>(1);
  const [sessionDraft, setSessionDraft] = useState<Partial<StudySession> | null>(null);
  const [ambientSound, setAmbientSoundState] = useState<'none' | 'rain' | 'stream' | 'white-noise'>('none');

  const [timer, setTimer] = useState<TimerState>({
    status: 'idle',
    timerPhase: 'focus',
    currentCycle: 1,
    totalCycles: 1,
    remainingSeconds: 25 * 60,
    targetFocusSeconds: 25 * 60,
    targetBreakSeconds: 5 * 60,
    elapsedFocusSeconds: 0,
    elapsedBreakSeconds: 0,
    startTimestamp: null,
  });

  const timerIntervalRef = useRef<number | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionDraft && parsed.sessionDraft.userId === currentUser.id) {
          setIsSessionActive(parsed.isSessionActive);
          setActivePhase(parsed.activePhase);
          setCurrentPrepStep(parsed.currentPrepStep || 1);
          setSessionDraft(parsed.sessionDraft);
          if (parsed.timer) {
            // Restore timer
            setTimer(parsed.timer);
          }
        }
      }
    } catch {}
  }, [currentUser.id]);

  // Persist session state to localStorage on changes
  useEffect(() => {
    if (isSessionActive && sessionDraft) {
      localStorage.setItem(
        LOCAL_STORAGE_ACTIVE_SESSION,
        JSON.stringify({
          isSessionActive,
          activePhase,
          currentPrepStep,
          sessionDraft,
          timer,
        })
      );
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);
    }
  }, [isSessionActive, activePhase, currentPrepStep, sessionDraft, timer]);

  // Timer Tick Engine
  useEffect(() => {
    if (timer.status === 'running') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev.status !== 'running') return prev;

          if (prev.remainingSeconds <= 1) {
            // Interval completed
            if (currentUser.preferences?.soundEnabled) {
              soundEngine.playChime(660, 4);
            }

            if (prev.timerPhase === 'focus') {
              // Focus period ended -> transition to break
              const isLastCycle = prev.currentCycle >= prev.totalCycles;
              return {
                ...prev,
                timerPhase: 'break',
                remainingSeconds: prev.targetBreakSeconds,
                elapsedFocusSeconds: prev.elapsedFocusSeconds + 1,
                currentCycle: isLastCycle ? prev.currentCycle : prev.currentCycle,
              };
            } else {
              // Break period ended -> transition to next focus cycle or repeat
              const nextCycle = prev.currentCycle + 1;
              return {
                ...prev,
                timerPhase: 'focus',
                currentCycle: nextCycle,
                remainingSeconds: prev.targetFocusSeconds,
                elapsedBreakSeconds: prev.elapsedBreakSeconds + 1,
              };
            }
          }

          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
            elapsedFocusSeconds:
              prev.timerPhase === 'focus' ? prev.elapsedFocusSeconds + 1 : prev.elapsedFocusSeconds,
            elapsedBreakSeconds:
              prev.timerPhase === 'break' ? prev.elapsedBreakSeconds + 1 : prev.elapsedBreakSeconds,
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.status, currentUser.preferences?.soundEnabled]);

  // Handle ambient sound playback
  const setAmbientSound = (sound: 'none' | 'rain' | 'stream' | 'white-noise') => {
    setAmbientSoundState(sound);
    if (sound === 'none') {
      soundEngine.stopAmbient();
    } else {
      soundEngine.startAmbient(sound, currentUser.preferences?.ambientVolume || 0.3);
    }
  };

  // Initialize a fresh study session
  const initNewSession = (
    initialTitle = '',
    initialSubject = '',
    plannerConfig?: {
      linkedActivityId?: string;
      plannedDuration?: number;
      timeBlockType?: TimeBlockType;
      intention?: string;
      targets?: StudyTarget[];
      pomodoroWork?: number;
      pomodoroBreak?: number;
      ultradianWork?: number;
      ultradianBreak?: number;
      preferredTechniques?: PerformanceTechnique[];
    }
  ) => {
    const prefs = currentUser.preferences;
    const defaultSpace = (prefs?.defaultSpaceChecklist || []).map((label, i) => ({
      id: `sp_${Date.now()}_${i}`,
      label,
      checked: false,
    }));
    const defaultEnergy = (prefs?.defaultEnergyChecklist || []).map((label, i) => ({
      id: `en_${Date.now()}_${i}`,
      label,
      checked: false,
    }));
    const defaultResources = (prefs?.defaultResourceChecklist || []).map((label, i) => ({
      id: `res_${Date.now()}_${i}`,
      label,
      checked: false,
    }));
    const defaultClosing = (prefs?.defaultClosingChecklist || []).map((label, i) => ({
      id: `cl_${Date.now()}_${i}`,
      label,
      checked: false,
    }));

    const blockType = plannerConfig?.timeBlockType || 'pomodoro';
    const pomodoroWork = plannerConfig?.pomodoroWork || prefs?.defaultPomodoroWork || 25;
    const pomodoroBreak = plannerConfig?.pomodoroBreak || prefs?.defaultPomodoroBreak || 5;
    const ultradianWork = plannerConfig?.ultradianWork || prefs?.defaultUltradianWork || 90;
    const ultradianBreak = plannerConfig?.ultradianBreak || prefs?.defaultUltradianBreak || 20;

    const initialTargets = plannerConfig?.targets && plannerConfig.targets.length > 0
      ? plannerConfig.targets
      : [
          {
            id: `target_${Date.now()}_1`,
            title: '',
            priority: 'high' as const,
            completed: false,
          },
        ];

    const newDraft: Partial<StudySession> = {
      id: `session_${Date.now()}`,
      userId: currentUser.id,
      title: initialTitle || 'Deep Focus Session',
      subject: initialSubject || currentUser.studyField || 'General Study',
      sessionDate: new Date().toISOString(),
      timeBlockType: blockType,
      plannedDuration: plannerConfig?.plannedDuration || (blockType === 'pomodoro' ? pomodoroWork : ultradianWork),
      actualDuration: 0,
      breakDuration: 0,
      linkedActivityId: plannerConfig?.linkedActivityId,
      preparation: {
        timeBlockType: blockType,
        pomodoroWorkMinutes: pomodoroWork,
        pomodoroBreakMinutes: pomodoroBreak,
        pomodoroCycles: 1,
        ultradianWorkMinutes: ultradianWork,
        ultradianBreakMinutes: ultradianBreak,
        spaceChecklist: defaultSpace,
        energyChecklist: defaultEnergy,
        energyConfirmed: false,
        resourceChecklist: defaultResources,
        resourcesConfirmed: false,
        intention: plannerConfig?.intention || '',
        targets: initialTargets,
        mood: 'Ready to study',
        mentalClarity: 'Clear',
        distractions: '',
        mindReady: false,
      },
      selectedTechniques: plannerConfig?.preferredTechniques || ['dot-focus'],
      targets: initialTargets.filter(t => t.title.trim().length > 0),
      sessionNotes: {
        summary: '',
        conceptsLearned: [],
        problemsSolved: [],
        ideasDiscovered: [],
        unfinishedTasks: [],
        questions: [],
        reminders: [],
        markdownNotes: '',
      },
      closingActivities: {
        organizeChecklist: defaultClosing,
        breathingCompleted: false,
        breathingDurationSeconds: 120,
        gratitudeReflection: '',
      },
      focusRating: 8,
      energyRating: 8,
      satisfactionRating: 8,
      averageScore: 8.0,
      reflection: '',
      status: 'completed',
    };

    setSessionDraft(newDraft);
    setIsSessionActive(true);
    setActivePhase('preparation');
    setCurrentPrepStep(1);

    // Initialize timer
    const targetFocusSec = (prefs?.defaultPomodoroWork || 25) * 60;
    const targetBreakSec = (prefs?.defaultPomodoroBreak || 5) * 60;
    setTimer({
      status: 'idle',
      timerPhase: 'focus',
      currentCycle: 1,
      totalCycles: 1,
      remainingSeconds: targetFocusSec,
      targetFocusSeconds: targetFocusSec,
      targetBreakSeconds: targetBreakSec,
      elapsedFocusSeconds: 0,
      elapsedBreakSeconds: 0,
      startTimestamp: null,
    });
  };

  const updateSessionDraft = (updater: (prev: Partial<StudySession>) => Partial<StudySession>) => {
    setSessionDraft(prev => (prev ? updater(prev) : prev));
  };

  const setPrepStep = (step: number) => {
    setCurrentPrepStep(Math.max(1, Math.min(5, step)));
  };

  // Complete Phase 1 and advance to Phase 2
  const completePreparation = () => {
    if (!sessionDraft || !sessionDraft.preparation) return;

    // Sync targets to root targets
    const validTargets = (sessionDraft.preparation.targets || []).filter(t => t.title.trim().length > 0);

    const isPomodoro = sessionDraft.timeBlockType === 'pomodoro';
    const focusMinutes = isPomodoro
      ? sessionDraft.preparation.pomodoroWorkMinutes || 25
      : sessionDraft.preparation.ultradianWorkMinutes || 90;
    const breakMinutes = isPomodoro
      ? sessionDraft.preparation.pomodoroBreakMinutes || 5
      : sessionDraft.preparation.ultradianBreakMinutes || 20;
    const cycles = isPomodoro ? sessionDraft.preparation.pomodoroCycles || 1 : 1;

    setSessionDraft(prev => ({
      ...prev,
      targets: validTargets,
      plannedDuration: focusMinutes * cycles,
    }));

    setTimer({
      status: 'idle',
      timerPhase: 'focus',
      currentCycle: 1,
      totalCycles: cycles,
      remainingSeconds: focusMinutes * 60,
      targetFocusSeconds: focusMinutes * 60,
      targetBreakSeconds: breakMinutes * 60,
      elapsedFocusSeconds: 0,
      elapsedBreakSeconds: 0,
      startTimestamp: null,
    });

    setActivePhase('performance');
  };

  const selectPerformanceTechnique = (technique: PerformanceTechnique) => {
    setSessionDraft(prev => {
      if (!prev) return prev;
      const current = prev.selectedTechniques || [];
      const updated = current.includes(technique)
        ? current.filter(t => t !== technique)
        : [...current, technique];
      return {
        ...prev,
        selectedTechniques: updated.length > 0 ? updated : [technique],
      };
    });
  };

  // Transition from mental technique to active Bliss Station
  const enterBlissStation = () => {
    if (currentUser.preferences?.soundEnabled) {
      soundEngine.playChime(528, 3.5);
    }
    // Auto start timer upon entering bliss station
    setTimer(prev => ({
      ...prev,
      status: 'running',
      startTimestamp: Date.now(),
    }));
  };

  // Timer actions
  const startTimer = () => {
    if (currentUser.preferences?.soundEnabled && timer.status === 'idle') {
      soundEngine.playChime(528, 2);
    }
    setTimer(prev => ({
      ...prev,
      status: 'running',
      startTimestamp: prev.startTimestamp || Date.now(),
    }));
  };

  const pauseTimer = () => {
    setTimer(prev => ({
      ...prev,
      status: 'paused',
    }));
  };

  const resumeTimer = () => {
    setTimer(prev => ({
      ...prev,
      status: 'running',
    }));
  };

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      status: 'idle',
      timerPhase: 'focus',
      remainingSeconds: prev.targetFocusSeconds,
    }));
  };

  const skipToBreak = () => {
    setTimer(prev => ({
      ...prev,
      timerPhase: 'break',
      remainingSeconds: prev.targetBreakSeconds,
    }));
  };

  const skipToFocus = () => {
    setTimer(prev => ({
      ...prev,
      timerPhase: 'focus',
      remainingSeconds: prev.targetFocusSeconds,
    }));
  };

  const toggleTargetCompleted = (targetId: string) => {
    setSessionDraft(prev => {
      if (!prev) return prev;
      const updated = (prev.targets || []).map(t =>
        t.id === targetId ? { ...t, completed: !t.completed } : t
      );
      return { ...prev, targets: updated };
    });
  };

  // End active timer and move to Phase 3: Preservation
  const endSessionToPreservation = () => {
    soundEngine.stopAmbient();
    setAmbientSoundState('none');

    const focusMinutes = Math.max(1, Math.round(timer.elapsedFocusSeconds / 60));
    const breakMinutes = Math.round(timer.elapsedBreakSeconds / 60);

    setTimer(prev => ({ ...prev, status: 'idle' }));
    setSessionDraft(prev => ({
      ...prev,
      actualDuration: focusMinutes,
      breakDuration: breakMinutes,
    }));

    if (currentUser.preferences?.soundEnabled) {
      soundEngine.playChime(440, 2.5);
    }

    setActivePhase('preservation');
  };

  // Finalize Phase 3 and save to database
  const completeAndSaveSession = (): StudySession | null => {
    if (!sessionDraft) return null;

    const avgScore = calculateAverageScore(
      sessionDraft.focusRating || 8,
      sessionDraft.energyRating || 8,
      sessionDraft.satisfactionRating || 8
    );

    const completedSession: StudySession = {
      id: sessionDraft.id || `session_${Date.now()}`,
      userId: currentUser.id,
      title: sessionDraft.title?.trim() || 'Deep Focus Session',
      subject: sessionDraft.subject?.trim() || 'General Study',
      sessionDate: sessionDraft.sessionDate || new Date().toISOString(),
      timeBlockType: sessionDraft.timeBlockType || 'pomodoro',
      plannedDuration: sessionDraft.plannedDuration || 25,
      actualDuration: sessionDraft.actualDuration || Math.max(1, Math.round(timer.elapsedFocusSeconds / 60)),
      breakDuration: sessionDraft.breakDuration || Math.round(timer.elapsedBreakSeconds / 60),
      preparation: sessionDraft.preparation!,
      selectedTechniques: sessionDraft.selectedTechniques || ['dot-focus'],
      targets: sessionDraft.targets || [],
      sessionNotes: sessionDraft.sessionNotes as SessionNotes,
      closingActivities: sessionDraft.closingActivities as ClosingData,
      focusRating: sessionDraft.focusRating || 8,
      energyRating: sessionDraft.energyRating || 8,
      satisfactionRating: sessionDraft.satisfactionRating || 8,
      averageScore: avgScore,
      reflection: sessionDraft.reflection || '',
      status: 'completed',
      linkedActivityId: sessionDraft.linkedActivityId,
      createdAt: sessionDraft.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to DB
    const saved = db.saveSession(completedSession);

    // If linked to a planned activity, mark it completed in the planner
    if (saved.linkedActivityId) {
      db.markActivityCompleted(saved.linkedActivityId, saved.id);
    }

    if (currentUser.preferences?.soundEnabled) {
      soundEngine.playCelebrationChime();
    }

    // Reset context state
    setIsSessionActive(false);
    setActivePhase('completed');
    setSessionDraft(null);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);

    return saved;
  };

  const cancelActiveSession = () => {
    soundEngine.stopAmbient();
    setAmbientSoundState('none');
    setIsSessionActive(false);
    setActivePhase('preparation');
    setSessionDraft(null);
    setTimer(prev => ({ ...prev, status: 'idle' }));
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION);
  };

  return (
    <SessionContext.Provider
      value={{
        isSessionActive,
        activePhase,
        currentPrepStep,
        sessionDraft,
        timer,
        initNewSession,
        setPrepStep,
        updateSessionDraft,
        completePreparation,
        selectPerformanceTechnique,
        enterBlissStation,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipToBreak,
        skipToFocus,
        toggleTargetCompleted,
        endSessionToPreservation,
        completeAndSaveSession,
        cancelActiveSession,
        ambientSound,
        setAmbientSound,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
