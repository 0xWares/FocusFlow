/**
 * Sessions History Page.
 * Search, multi-dimensional filtering, sorting, and full session inspection.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Flame,
  Trash2,
} from 'lucide-react';
import { StudySession } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { formatDuration } from '../../utils/sessionMath';
import { SessionDetailModal } from './SessionDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SessionsHistoryView: React.FC = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>(() => db.getSessions(currentUser.id));
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  useEffect(() => {
    setSessions(db.getSessions(currentUser.id));
    return db.subscribeData(() => {
      setSessions(db.getSessions(currentUser.id));
    });
  }, [currentUser.id]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTechnique, setSelectedTechnique] = useState<'all' | 'pomodoro' | 'ultradian'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest-score' | 'duration'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected session for modal
  const [inspectingSession, setInspectingSession] = useState<StudySession | null>(null);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.subject) set.add(s.subject);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Filter & Sort
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchSubject = s.subject.toLowerCase().includes(q);
          const matchNotes = (s.sessionNotes?.summary || '').toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchNotes) return false;
        }

        // Subject filter
        if (selectedSubject !== 'all' && s.subject !== selectedSubject) {
          return false;
        }

        // Technique filter
        if (selectedTechnique !== 'all' && s.timeBlockType !== selectedTechnique) {
          return false;
        }

        // Date filter
        if (selectedDateFilter !== 'all') {
          const sDate = new Date(s.sessionDate);
          const now = new Date();
          if (selectedDateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            if (!s.sessionDate.startsWith(todayStr)) return false;
          } else if (selectedDateFilter === '7days') {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 7);
            if (sDate < cutoff) return false;
          } else if (selectedDateFilter === '30days') {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 30);
            if (sDate < cutoff) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
        }
        if (sortBy === 'highest-score') {
          return (b.averageScore || 0) - (a.averageScore || 0);
        }
        if (sortBy === 'duration') {
          return (b.actualDuration || 0) - (a.actualDuration || 0);
        }
        return 0;
      });
  }, [sessions, searchQuery, selectedSubject, selectedTechnique, selectedDateFilter, sortBy]);

  const handleDeleteSession = (id: string) => {
    db.deleteSession(id);
    setSessions(db.getSessions(currentUser.id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
            Study Sessions History
          </h1>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            Review, evaluate, and trace your study sessions across all subjects
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#EAEAE4] dark:bg-[#202225] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#18191C] text-[#1C1D1F] dark:text-white shadow-xs'
                  : 'text-[#717376] dark:text-[#9A9CA0]'
              }`}
              aria-label="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#18191C] text-[#1C1D1F] dark:text-white shadow-xs'
                  : 'text-[#717376] dark:text-[#9A9CA0]'
              }`}
              aria-label="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-4 md:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717376]" />
            <input
              type="text"
              placeholder="Search by session title, subject, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest-score">Sort: Highest Score</option>
              <option value="duration">Sort: Longest Duration</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAEAE4] dark:border-[#26282B] text-xs">
          {/* Technique filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#717376] dark:text-[#9A9CA0]">Technique:</span>
            {(['all', 'pomodoro', 'ultradian'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedTechnique(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  selectedTechnique === type
                    ? 'bg-[#2D5A46] text-white'
                    : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#717376] dark:text-[#9A9CA0]">Range:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Past 7 Days' },
              { id: '30days', label: 'Past 30 Days' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedDateFilter(r.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedDateFilter === r.id
                    ? 'bg-[#2D5A46] text-white'
                    : 'bg-[#F0F0EB] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Content List / Grid */}
      {filteredSessions.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-[#717376] dark:text-[#9A9CA0]">
            No study sessions matched your current filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setSelectedTechnique('all');
              setSelectedDateFilter('all');
            }}
            className="text-xs text-[#2D5A46] dark:text-[#4E9473] font-semibold hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map(session => {
            const dateStr = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(session.sessionDate));

            const completedTargets = session.targets?.filter(t => t.completed).length || 0;
            const totalTargets = session.targets?.length || 0;

            return (
              <div
                key={session.id}
                onClick={() => setInspectingSession(session)}
                className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-5 hover:border-[#2D5A46] dark:hover:border-[#4E9473] transition-all cursor-pointer space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
                    <span className="capitalize">{session.timeBlockType}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{dateStr}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className="p-1 rounded-md text-[#A0A2A5] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete study session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9] line-clamp-1">
                    {session.title}
                  </h3>

                  <div className="text-xs text-[#717376] dark:text-[#9A9CA0] flex items-center gap-2">
                    <span>{session.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatDuration(session.actualDuration)}</span>
                  </div>

                  {session.sessionNotes?.summary && (
                    <p className="text-xs text-[#505255] dark:text-[#A0A2A5] line-clamp-2">
                      {session.sessionNotes.summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EAEAE4] dark:border-[#26282B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[#717376] dark:text-[#9A9CA0]">
                      Targets: <strong className="text-[#1C1D1F] dark:text-white font-mono">{completedTargets}/{totalTargets}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[#717376] dark:text-[#9A9CA0]">Score:</span>
                    <span className="font-mono font-bold text-sm text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                      {session.averageScore.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] dark:bg-[#151618] border-b border-[#EAEAE4] dark:border-[#26282B] text-[#717376] dark:text-[#9A9CA0]">
              <tr>
                <th className="py-3 px-4 font-semibold">Session Title</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold text-right">Duration</th>
                <th className="py-3 px-4 font-semibold text-right">Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA] dark:divide-[#232528]">
              {filteredSessions.map(session => {
                const dateStr = new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(session.sessionDate));

                return (
                  <tr
                    key={session.id}
                    onClick={() => setInspectingSession(session)}
                    className="hover:bg-[#F9F9F7] dark:hover:bg-[#1D1F23] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] max-w-xs truncate">
                      {session.title}
                    </td>
                    <td className="py-3 px-4 text-[#717376] dark:text-[#9A9CA0]">
                      {session.subject}
                    </td>
                    <td className="py-3 px-4 text-[#717376] dark:text-[#9A9CA0] whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#505255] dark:text-[#A0A2A5]">
                      {session.timeBlockType}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right text-[#1C1D1F] dark:text-[#FBFBF9]">
                      {formatDuration(session.actualDuration)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-[#2D5A46] dark:text-[#4E9473] tabular-nums">
                      {session.averageScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session);
                          }}
                          className="p-1 rounded text-[#A0A2A5] hover:text-red-600 transition-colors"
                          title="Delete study session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#A0A2A5] inline" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Report Modal */}
      {inspectingSession && (
        <SessionDetailModal
          session={inspectingSession}
          onClose={() => setInspectingSession(null)}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Direct Delete Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete Study Session"
        description={`Are you sure you want to delete "${sessionToDelete?.title}"? This study session will be permanently removed.`}
        confirmLabel="Delete Session"
        isDestructive={true}
        onConfirm={() => {
          if (sessionToDelete) {
            handleDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onClose={() => setSessionToDelete(null)}
      />
    </div>
  );
};
