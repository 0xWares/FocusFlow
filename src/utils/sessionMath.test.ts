import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAverageScore,
  calculateStreak,
  calculateTotalHours,
  calculateTargetCompletionRate,
  formatDuration,
  formatTimerSeconds,
  generatePerformanceInsights,
} from './sessionMath';
import { StudySession } from '../types';

test('calculateAverageScore calculates and rounds accurately', () => {
  assert.equal(calculateAverageScore(8, 9, 8), 8.3);
  assert.equal(calculateAverageScore(10, 10, 10), 10);
  assert.equal(calculateAverageScore(1, 1, 1), 1);
  assert.equal(calculateAverageScore(7, 8, 7), 7.3);
});

test('calculateTotalHours sums durations and rounds to 1 decimal', () => {
  const dummySessions = [
    { actualDuration: 50, status: 'completed' },
    { actualDuration: 45, status: 'completed' },
    { actualDuration: 25, status: 'completed' },
  ] as StudySession[];
  // 120 minutes = 2.0 hours
  assert.equal(calculateTotalHours(dummySessions), 2.0);
});

test('calculateTargetCompletionRate computes correct percentage', () => {
  assert.equal(calculateTargetCompletionRate([
    { completed: true },
    { completed: true },
    { completed: false },
    { completed: true },
  ]), 75);
  assert.equal(calculateTargetCompletionRate([]), 0);
});

test('formatDuration outputs readable hours and minutes', () => {
  assert.equal(formatDuration(25), '25m');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(0), '0m');
});

test('formatTimerSeconds formats into MM:SS or HH:MM:SS', () => {
  assert.equal(formatTimerSeconds(65), '01:05');
  assert.equal(formatTimerSeconds(1500), '25:00');
  assert.equal(formatTimerSeconds(3665), '1:01:05');
});

test('calculateStreak computes active consecutive day streak and longest streak', () => {
  const baseDate = new Date('2026-11-07T12:00:00Z');
  const sessions: StudySession[] = [
    {
      sessionDate: '2026-11-05T10:00:00Z',
      actualDuration: 50,
      status: 'completed',
    } as StudySession,
    {
      sessionDate: '2026-11-06T14:00:00Z',
      actualDuration: 90,
      status: 'completed',
    } as StudySession,
    {
      sessionDate: '2026-11-07T09:00:00Z',
      actualDuration: 50,
      status: 'completed',
    } as StudySession,
  ];

  const result = calculateStreak(sessions, baseDate);
  assert.equal(result.currentStreak, 3);
  assert.equal(result.longestStreak, 3);
});

test('generatePerformanceInsights returns insights when sessions provided', () => {
  const mockSessions: StudySession[] = [
    {
      sessionDate: '2026-11-01T09:00:00Z',
      actualDuration: 50,
      status: 'completed',
      focusRating: 9,
      energyRating: 8,
      satisfactionRating: 9,
      averageScore: 8.7,
      timeBlockType: 'pomodoro',
      preparation: {
        spaceChecklist: [{ checked: true }, { checked: true }, { checked: true }, { checked: true }],
        mindReady: true,
      },
      targets: [{ id: '1', title: 'Target 1', priority: 'high', completed: true }],
    } as any,
    {
      sessionDate: '2026-11-02T09:30:00Z',
      actualDuration: 50,
      status: 'completed',
      focusRating: 9,
      energyRating: 9,
      satisfactionRating: 9,
      averageScore: 9.0,
      timeBlockType: 'pomodoro',
      preparation: {
        spaceChecklist: [{ checked: true }, { checked: true }, { checked: true }, { checked: true }],
        mindReady: true,
      },
      targets: [{ id: '2', title: 'Target 2', priority: 'medium', completed: true }],
    } as any,
    {
      sessionDate: '2026-11-03T18:00:00Z',
      actualDuration: 50,
      status: 'completed',
      focusRating: 6,
      energyRating: 6,
      satisfactionRating: 7,
      averageScore: 6.3,
      timeBlockType: 'pomodoro',
      preparation: {
        spaceChecklist: [{ checked: false }],
        mindReady: false,
      },
      targets: [],
    } as any,
  ];

  const insights = generatePerformanceInsights(mockSessions);
  assert.ok(insights.length > 0);
});
