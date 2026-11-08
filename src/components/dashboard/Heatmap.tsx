/**
 * Study Activity Heatmap Component.
 * Displays daily study density across the past 60 days with clean hover tooltips.
 */

import React, { useState } from 'react';
import { StudySession } from '../../types';
import { formatDuration } from '../../utils/sessionMath';

interface HeatmapProps {
  sessions: StudySession[];
  daysCount?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ sessions, daysCount = 70 }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; minutes: number; count: number } | null>(null);

  // Map sessions into daily minutes
  const dailyMap: Record<string, { minutes: number; count: number }> = {};
  for (const s of sessions) {
    if (s.status === 'completed' && s.actualDuration > 0) {
      const dayKey = s.sessionDate.split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { minutes: 0, count: 0 };
      }
      dailyMap[dayKey].minutes += s.actualDuration;
      dailyMap[dayKey].count += 1;
    }
  }

  // Generate array of days up to today
  const days: { dateStr: string; date: Date; minutes: number; count: number }[] = [];
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const data = dailyMap[dateStr] || { minutes: 0, count: 0 };
    days.push({
      dateStr,
      date: d,
      minutes: data.minutes,
      count: data.count,
    });
  }

  // Group into columns of 7 days (weeks)
  const weeks: typeof days[] = [];
  let curWeek: typeof days = [];

  // Align starting day of week (0 = Sunday, 1 = Monday)
  const firstDayOfWeek = days[0].date.getDay();
  // Pad if needed
  for (let p = 0; p < firstDayOfWeek; p++) {
    curWeek.push(null as unknown as (typeof days)[0]);
  }

  for (const day of days) {
    curWeek.push(day);
    if (curWeek.length === 7) {
      weeks.push(curWeek);
      curWeek = [];
    }
  }
  if (curWeek.length > 0) {
    weeks.push(curWeek);
  }

  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return 'bg-[#EAEAE4] dark:bg-[#202225]';
    if (minutes < 45) return 'bg-[#A3C4B4] dark:bg-[#2D5A46]/50';
    if (minutes < 90) return 'bg-[#5B9577] dark:bg-[#3A7559]';
    if (minutes < 150) return 'bg-[#2D5A46] dark:bg-[#4E9473]';
    return 'bg-[#1D3D2F] dark:bg-[#68B893]';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
        <div className="flex items-center gap-1.5">
          <span>Daily study consistency</span>
          <span aria-hidden="true">·</span>
          <span>Last 10 weeks</span>
        </div>

        {/* Hover info or Legend */}
        {hoveredDay ? (
          <span className="font-mono text-[#1C1D1F] dark:text-[#FBFBF9] font-medium">
            {hoveredDay.date}: {formatDuration(hoveredDay.minutes)} ({hoveredDay.count} {hoveredDay.count === 1 ? 'session' : 'sessions'})
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-xs bg-[#EAEAE4] dark:bg-[#202225]" />
              <div className="w-2.5 h-2.5 rounded-xs bg-[#A3C4B4] dark:bg-[#2D5A46]/50" />
              <div className="w-2.5 h-2.5 rounded-xs bg-[#5B9577] dark:bg-[#3A7559]" />
              <div className="w-2.5 h-2.5 rounded-xs bg-[#2D5A46] dark:bg-[#4E9473]" />
              <div className="w-2.5 h-2.5 rounded-xs bg-[#1D3D2F] dark:bg-[#68B893]" />
            </div>
            <span>More</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1.5 items-start">
          {/* Day of week labels */}
          <div className="grid grid-rows-7 gap-1.5 text-[10px] text-[#8E9094] dark:text-[#7A7D82] pr-1 leading-3 font-mono">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          {/* Weeks columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1.5">
              {week.map((day, dIdx) => {
                if (!day) {
                  return <div key={`empty_${dIdx}`} className="w-3.5 h-3.5" />;
                }
                return (
                  <div
                    key={day.dateStr}
                    onMouseEnter={() =>
                      setHoveredDay({
                        date: day.dateStr,
                        minutes: day.minutes,
                        count: day.count,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${getIntensityClass(
                      day.minutes
                    )}`}
                    title={`${day.dateStr}: ${formatDuration(day.minutes)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
