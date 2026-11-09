import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, CheckCircle2 } from 'lucide-react';
import { DailyPlan } from '../../types';
import { getTodayDateStr, formatMinutes } from '../../utils/planner';

interface TimelineMonthViewProps {
  currentDate: string;
  allPlans: DailyPlan[];
  onSelectDate: (date: string) => void;
}

export const TimelineMonthView: React.FC<TimelineMonthViewProps> = ({
  currentDate,
  allPlans,
  onSelectDate,
}) => {
  const [activeDateObj, setActiveDateObj] = useState(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const todayStr = getTodayDateStr();

  // Create lookup map
  const plansByDate = useMemo(() => {
    const map = new Map<string, DailyPlan>();
    for (const plan of allPlans) {
      map.set(plan.date, plan);
    }
    return map;
  }, [allPlans]);

  const year = activeDateObj.getFullYear();
  const month = activeDateObj.getMonth();

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(activeDateObj);

  // Calculate calendar grid days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDayOfMonth.getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }> = [];

    // Preceding padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const yr = prevDate.getFullYear();
      const mo = (prevDate.getMonth() + 1).toString().padStart(2, '0');
      const da = d.toString().padStart(2, '0');
      cells.push({
        dateStr: `${yr}-${mo}-${da}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const yr = year;
      const mo = (month + 1).toString().padStart(2, '0');
      const da = d.toString().padStart(2, '0');
      cells.push({
        dateStr: `${yr}-${mo}-${da}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Trailing padding days to fill 35 or 42 grid slots
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const yr = nextDate.getFullYear();
      const mo = (nextDate.getMonth() + 1).toString().padStart(2, '0');
      const da = d.toString().padStart(2, '0');
      cells.push({
        dateStr: `${yr}-${mo}-${da}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const handlePrevMonth = () => {
    setActiveDateObj(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveDateObj(new Date(year, month + 1, 1));
  };

  return (
    <div className="border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl bg-white dark:bg-[#141517] overflow-hidden shadow-xs">
      {/* Month Navigation Header */}
      <div className="px-5 py-3 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#18191B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
            {monthName}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#F6F6F2] dark:bg-[#1B1D20] text-center py-2 text-[11px] font-semibold text-[#717376] dark:text-[#9A9CA0]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#EAEAE4] dark:divide-[#26282B]">
        {calendarCells.map(cell => {
          const plan = plansByDate.get(cell.dateStr);
          const activities = plan?.activities || [];
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === currentDate;

          const totalStudyMins = activities
            .filter(a => a.isStudySession || ['study', 'revision', 'learning'].includes(a.category))
            .reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[90px] p-2 text-left flex flex-col justify-between transition-colors ${
                !cell.isCurrentMonth
                  ? 'opacity-30 bg-[#FAFAF8] dark:bg-[#121314]'
                  : isSelected
                  ? 'bg-[#2D5A46]/10 dark:bg-emerald-950/30'
                  : 'hover:bg-[#F9F9F6] dark:hover:bg-[#17181B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-[#2D5A46] text-white flex items-center justify-center'
                      : isSelected
                      ? 'text-[#2D5A46] dark:text-emerald-400'
                      : 'text-[#1C1D1F] dark:text-[#FBFBF9]'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {plan?.dailyReview && (
                  <span title="Day reviewed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                )}
              </div>

              <div className="space-y-1 mt-1">
                {activities.length > 0 && (
                  <div className="text-[10px] text-[#505255] dark:text-[#A0A2A5] font-medium truncate">
                    {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                  </div>
                )}

                {totalStudyMins > 0 && (
                  <div className="text-[10px] font-mono font-semibold text-[#2D5A46] dark:text-emerald-400 truncate">
                    {formatMinutes(totalStudyMins)} study
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
