import React, { useMemo } from 'react';
import { Calendar, Plus, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { DailyPlan, PlannerActivity } from '../../types';
import {
  getWeekDays,
  getTodayDateStr,
  formatMinutes,
  getCategoryMeta,
} from '../../utils/planner';

interface TimelineWeekViewProps {
  currentDate: string;
  allPlans: DailyPlan[];
  onSelectDate: (date: string) => void;
  onAddActivityForDate: (date: string) => void;
}

export const TimelineWeekView: React.FC<TimelineWeekViewProps> = ({
  currentDate,
  allPlans,
  onSelectDate,
  onAddActivityForDate,
}) => {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const todayStr = getTodayDateStr();

  // Create a map of date -> plan
  const plansByDate = useMemo(() => {
    const map = new Map<string, DailyPlan>();
    for (const plan of allPlans) {
      map.set(plan.date, plan);
    }
    return map;
  }, [allPlans]);

  return (
    <div className="border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl bg-white dark:bg-[#141517] overflow-hidden shadow-xs">
      <div className="px-5 py-3 border-b border-[#EAEAE4] dark:border-[#26282B] bg-[#FAFAF8] dark:bg-[#18191B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2D5A46] dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9] uppercase tracking-wider">
            7-Day Weekly Overview & Study Balance
          </h3>
        </div>

        <span className="text-xs text-[#717376] dark:text-[#9A9CA0]">
          Click any day to open daily timeline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#EAEAE4] dark:divide-[#26282B] min-h-[500px]">
        {weekDays.map(dateStr => {
          const [y, m, d] = dateStr.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);
          const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateObj);

          const isToday = dateStr === todayStr;
          const isSelected = dateStr === currentDate;
          const plan = plansByDate.get(dateStr);
          const activities = plan?.activities || [];

          const totalStudyMins = activities
            .filter(a => a.isStudySession || ['study', 'revision', 'learning'].includes(a.category))
            .reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

          return (
            <div
              key={dateStr}
              className={`flex flex-col justify-between p-3 transition-colors ${
                isSelected
                  ? 'bg-[#2D5A46]/5 dark:bg-emerald-950/20'
                  : 'hover:bg-[#FAFAF8] dark:hover:bg-[#18191B]'
              }`}
            >
              {/* Day Header */}
              <div>
                <button
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#717376] dark:text-[#9A9CA0]">
                      {dayName}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2D5A46] text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-lg font-bold font-mono ${
                        isSelected
                          ? 'text-[#2D5A46] dark:text-emerald-400'
                          : 'text-[#1C1D1F] dark:text-[#FBFBF9]'
                      }`}
                    >
                      {d}
                    </span>
                    <span className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
                      {monthName}
                    </span>
                  </div>
                </button>

                {/* Total study badge */}
                <div className="mt-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#2D5A46]/10 text-[#2D5A46] dark:bg-emerald-950/50 dark:text-emerald-300">
                    <BookOpen className="w-2.5 h-2.5" />
                    {formatMinutes(totalStudyMins)} study
                  </span>
                </div>

                {/* Activities List */}
                <div className="space-y-1.5">
                  {activities.length === 0 ? (
                    <p className="text-[11px] text-[#A0A2A5] italic py-2">
                      No blocks
                    </p>
                  ) : (
                    activities.slice(0, 5).map(act => {
                      const meta = getCategoryMeta(act.category);
                      return (
                        <div
                          key={act.id}
                          onClick={() => onSelectDate(dateStr)}
                          className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-transform hover:scale-[1.02] ${meta.borderLight} ${meta.bgLight} ${meta.borderDark} ${meta.bgDark}`}
                        >
                          <div className="font-mono text-[9px] text-[#717376] dark:text-[#9A9CA0]">
                            {act.startTime}
                          </div>
                          <div className="font-medium truncate text-[#1C1D1F] dark:text-[#FBFBF9]">
                            {act.title}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {activities.length > 5 && (
                    <button
                      type="button"
                      onClick={() => onSelectDate(dateStr)}
                      className="text-[10px] text-[#2D5A46] dark:text-emerald-400 font-semibold hover:underline"
                    >
                      +{activities.length - 5} more...
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Quick Add */}
              <div className="pt-3 mt-3 border-t border-[#EAEAE4] dark:border-[#26282B]">
                <button
                  type="button"
                  onClick={() => onAddActivityForDate(dateStr)}
                  className="w-full py-1 text-[11px] font-semibold text-[#717376] hover:text-[#2D5A46] dark:hover:text-emerald-400 flex items-center justify-center gap-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add block</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
