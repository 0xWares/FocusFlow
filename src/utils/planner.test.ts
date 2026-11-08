import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  calculateDurationMinutes,
  formatMinutes,
  isOverlapping,
  detectConflicts,
  findMissingBuffers,
  calculateDailyMetrics,
  calculatePlannedVsActual,
  addDays,
  getTodayDateStr,
  getTomorrowDateStr,
} from './planner';
import { PlannerActivity, StudySession } from '../types';

test('timeToMinutes converts HH:MM to minutes accurately', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('01:30'), 90);
  assert.equal(timeToMinutes('08:45'), 525);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('minutesToTime formats minutes to zero-padded HH:MM string', () => {
  assert.equal(minutesToTime(0), '00:00');
  assert.equal(minutesToTime(90), '01:30');
  assert.equal(minutesToTime(525), '08:45');
  assert.equal(minutesToTime(1439), '23:59');
});

test('calculateDurationMinutes returns exact difference in minutes', () => {
  assert.equal(calculateDurationMinutes('08:00', '09:30'), 90);
  assert.equal(calculateDurationMinutes('10:15', '11:00'), 45);
  assert.equal(calculateDurationMinutes('14:00', '14:00'), 0);
});

test('formatMinutes outputs clean readable durations', () => {
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(60), '1h');
  assert.equal(formatMinutes(90), '1h 30m');
  assert.equal(formatMinutes(125), '2h 5m');
  assert.equal(formatMinutes(0), '0m');
});

test('isOverlapping detects standard time collisions', () => {
  // [8:00, 9:30) and [9:00, 10:00) -> overlaps from 9:00 to 9:30
  assert.equal(isOverlapping(480, 570, 540, 600), true);

  // Touching edges: [8:00, 9:00) and [9:00, 10:00) -> does NOT overlap
  assert.equal(isOverlapping(480, 540, 540, 600), false);

  // Separate intervals: [8:00, 9:00) and [10:00, 11:00) -> does NOT overlap
  assert.equal(isOverlapping(480, 540, 600, 660), false);

  // Fully contained: [8:00, 11:00) and [9:00, 10:00) -> overlaps
  assert.equal(isOverlapping(480, 660, 540, 600), true);
});

test('detectConflicts finds overlapping activities on the schedule', () => {
  const existing: PlannerActivity[] = [
    {
      id: 'act1',
      userId: 'user1',
      date: '2026-11-08',
      title: 'Math Study',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      priority: 'high',
      status: 'scheduled',
      category: 'study',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'act2',
      userId: 'user1',
      date: '2026-11-08',
      title: 'Physics Revision',
      startTime: '11:00',
      endTime: '12:00',
      durationMinutes: 60,
      priority: 'medium',
      status: 'scheduled',
      category: 'revision',
      createdAt: '',
      updatedAt: '',
    },
  ];

  // Conflict scenario: proposed 10:00 - 11:30 overlaps with act1 (10:00-10:30) and act2 (11:00-11:30)
  const result1 = detectConflicts('10:00', '11:30', existing);
  assert.equal(result1.hasConflict, true);
  assert.equal(result1.conflictingActivities.length, 2);

  // Clean slot scenario: proposed 10:30 - 11:00 fits perfectly in the gap
  const result2 = detectConflicts('10:30', '11:00', existing);
  assert.equal(result2.hasConflict, false);
  assert.equal(result2.conflictingActivities.length, 0);

  // Self-ignore when editing existing activity
  const result3 = detectConflicts('09:00', '10:30', existing, 'act1');
  assert.equal(result3.hasConflict, false);
});

test('findMissingBuffers alerts when intensive study blocks are back-to-back with 0m buffer', () => {
  const activities: PlannerActivity[] = [
    {
      id: 'act1',
      userId: 'u1',
      date: '2026-11-08',
      title: 'Deep Work 1',
      category: 'study',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      priority: 'high',
      status: 'scheduled',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'act2',
      userId: 'u1',
      date: '2026-11-08',
      title: 'Deep Work 2',
      category: 'revision',
      startTime: '10:30',
      endTime: '12:00',
      durationMinutes: 90,
      priority: 'high',
      status: 'scheduled',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const buffers = findMissingBuffers(activities);
  assert.equal(buffers.length, 1);
  assert.equal(buffers[0].afterTitle, 'Deep Work 1');
  assert.equal(buffers[0].suggestedTime, '10:30');
});

test('calculateDailyMetrics aggregates schedule statistics', () => {
  const activities: PlannerActivity[] = [
    {
      id: 'a1',
      userId: 'u1',
      date: '2026-11-08',
      title: 'Study session',
      category: 'study',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      priority: 'high',
      status: 'completed',
      isStudySession: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'a2',
      userId: 'u1',
      date: '2026-11-08',
      title: 'Break',
      category: 'break',
      startTime: '10:30',
      endTime: '11:00',
      durationMinutes: 30,
      priority: 'low',
      status: 'scheduled',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const metrics = calculateDailyMetrics(activities);
  assert.equal(metrics.totalActivities, 2);
  assert.equal(metrics.completedActivities, 1);
  assert.equal(metrics.completionRate, 50);
  assert.equal(metrics.totalStudyMinutes, 90);
  assert.equal(metrics.totalBreakMinutes, 30);
  assert.equal(metrics.totalScheduledMinutes, 120);
  assert.equal(metrics.unallocatedMinutes, 1440 - 120);
  assert.equal(metrics.plannedStudySessionsCount, 1);
});

test('calculatePlannedVsActual computes comparison with completed sessions', () => {
  const targetDate = '2026-11-08';
  const planned: PlannerActivity[] = [
    {
      id: 'act_s1',
      userId: 'u1',
      date: targetDate,
      title: 'Calculus Session',
      category: 'study',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      priority: 'high',
      status: 'completed',
      isStudySession: true,
      linkedSessionId: 'sess_1',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const actuals: StudySession[] = [
    {
      id: 'sess_1',
      userId: 'u1',
      title: 'Calculus Session',
      subject: 'Math',
      sessionDate: '2026-11-08T09:00:00.000Z',
      actualDuration: 95,
      status: 'completed',
    } as any,
  ];

  const comparison = calculatePlannedVsActual(planned, actuals, targetDate);
  assert.equal(comparison.plannedStudyMinutes, 90);
  assert.equal(comparison.actualStudyMinutes, 95);
  assert.equal(comparison.varianceMinutes, 5);
  assert.equal(comparison.linkedCompletedCount, 1);
});

test('date helpers compute today, tomorrow and addDays correctly', () => {
  const today = getTodayDateStr();
  const tomorrow = getTomorrowDateStr();
  assert.equal(addDays(today, 1), tomorrow);
  assert.equal(addDays(tomorrow, -1), today);
});
