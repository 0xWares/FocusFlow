/**
 * Settings & Personalization View.
 * Customizes timer presets, default checklists, theme, and user profile.
 */

import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Layout,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PerformanceTechnique } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    createUser,
    updatePreferences,
    updateProfile,
    resetUserDemoData,
  } = useAuth();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const prefs = currentUser.preferences;

  // Form states
  const [pomodoroWork, setPomodoroWork] = useState(prefs.defaultPomodoroWork);
  const [pomodoroBreak, setPomodoroBreak] = useState(prefs.defaultPomodoroBreak);
  const [ultradianWork, setUltradianWork] = useState(prefs.defaultUltradianWork);
  const [ultradianBreak, setUltradianBreak] = useState(prefs.defaultUltradianBreak);
  const [soundEnabled, setSoundEnabled] = useState(prefs.soundEnabled);
  const [dailyHourTarget, setDailyHourTarget] = useState(prefs.dailyHourTarget);

  // Profile states
  const [name, setName] = useState(currentUser.name);
  const [studyField, setStudyField] = useState(currentUser.studyField);

  // New user form state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserField, setNewUserField] = useState('');

  // Checklists editor states
  const [spaceList, setSpaceList] = useState<string[]>(prefs.defaultSpaceChecklist || []);
  const [newSpaceText, setNewSpaceText] = useState('');

  const [energyList, setEnergyList] = useState<string[]>(prefs.defaultEnergyChecklist || []);
  const [newEnergyText, setNewEnergyText] = useState('');

  const [resourceList, setResourceList] = useState<string[]>(prefs.defaultResourceChecklist || []);
  const [newResourceText, setNewResourceText] = useState('');

  const [closingList, setClosingList] = useState<string[]>(prefs.defaultClosingChecklist || []);
  const [newClosingText, setNewClosingText] = useState('');

  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      defaultPomodoroWork: pomodoroWork,
      defaultPomodoroBreak: pomodoroBreak,
      defaultUltradianWork: ultradianWork,
      defaultUltradianBreak: ultradianBreak,
      soundEnabled,
      dailyHourTarget,
      defaultSpaceChecklist: spaceList,
      defaultEnergyChecklist: energyList,
      defaultResourceChecklist: resourceList,
      defaultClosingChecklist: closingList,
    });
    updateProfile(name, studyField);
    setSaveMessage('Preferences successfully saved!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    createUser(newUserName.trim(), newUserEmail.trim(), newUserField.trim() || 'General Study');
    setIsCreatingUser(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserField('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1D1F] dark:text-[#FBFBF9]">
            Settings & Personalization
          </h1>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            Customize timer durations, default preparation rituals, and study profiles
          </p>
        </div>

        {saveMessage && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D5A46] dark:text-[#4E9473] bg-[#2D5A46]/10 px-3 py-1.5 rounded-lg animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SECTION 1: USER PROFILE & ACCOUNT SWITCHER */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Student Profile & User Account
            </h2>

            {/* Switch User Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#717376] dark:text-[#9A9CA0]">Account:</span>
              <select
                value={currentUser.id}
                onChange={e => switchUser(e.target.value)}
                className="p-1.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white text-xs"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsCreatingUser(true)}
                className="text-xs text-[#2D5A46] dark:text-[#4E9473] font-semibold hover:underline ml-1"
              >
                + New Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Primary Study Field / Major</label>
              <input
                type="text"
                value={studyField}
                onChange={e => setStudyField(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[#717376] dark:text-[#9A9CA0] mb-1">Daily Study Target (Hours)</label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={dailyHourTarget}
                onChange={e => setDailyHourTarget(parseFloat(e.target.value) || 4)}
                className="w-full p-2.5 rounded-xl border border-[#E0E0DA] dark:border-[#2E3136] bg-[#FAF8F5] dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
              />
            </div>
          </div>

          {/* New User Account Drawer/Modal */}
          {isCreatingUser && (
            <div className="p-4 rounded-xl border border-dashed border-[#2D5A46] bg-[#2D5A46]/5 dark:bg-[#2D5A46]/10 space-y-3">
              <h3 className="font-bold text-xs text-[#1C1D1F] dark:text-white">
                Register New Student Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="text-xs p-2 rounded-lg border bg-white dark:bg-[#1A1C1F]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="text-xs p-2 rounded-lg border bg-white dark:bg-[#1A1C1F]"
                />
                <input
                  type="text"
                  placeholder="Study Major (e.g. Pre-Med)"
                  value={newUserField}
                  onChange={e => setNewUserField(e.target.value)}
                  className="text-xs p-2 rounded-lg border bg-white dark:bg-[#1A1C1F]"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-3 py-1 text-[#717376]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  className="px-3 py-1 bg-[#2D5A46] text-white rounded-lg font-medium"
                >
                  Create & Switch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: TIMER CONFIGURATION */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
            Default Timer Intervals & Audio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Pomodoro Defaults */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B] space-y-3">
              <span className="font-bold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Pomodoro Technique Defaults
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                    Work Sprint (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={pomodoroWork}
                    onChange={e => setPomodoroWork(parseInt(e.target.value) || 25)}
                    className="w-full p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                    Short Break (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={pomodoroBreak}
                    onChange={e => setPomodoroBreak(parseInt(e.target.value) || 5)}
                    className="w-full p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F]"
                  />
                </div>
              </div>
            </div>

            {/* Ultradian Defaults */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#26282B] space-y-3">
              <span className="font-bold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Ultradian Rhythm Defaults
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                    Deep Work (min)
                  </label>
                  <input
                    type="number"
                    min="45"
                    max="180"
                    value={ultradianWork}
                    onChange={e => setUltradianWork(parseInt(e.target.value) || 90)}
                    className="w-full p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#717376] dark:text-[#9A9CA0] block mb-1">
                    Rest Recovery (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="45"
                    value={ultradianBreak}
                    onChange={e => setUltradianBreak(parseInt(e.target.value) || 20)}
                    className="w-full p-2 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#1A1C1F]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sound & Notifications Toggle */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#2D5A46] dark:text-[#4E9473]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#717376]" />
              )}
              <span className="font-medium text-[#1C1D1F] dark:text-[#FBFBF9]">
                Zen Bowl Chimes & Interval Alerts
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                soundEnabled
                  ? 'bg-[#2D5A46] text-white shadow-xs'
                  : 'bg-[#EAEAE4] text-[#505255] dark:bg-[#202225] dark:text-[#A0A2A5]'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* SECTION 3: DEFAULT CHECKLISTS CUSTOMIZER */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
            Default Preparation & Closing Checklists
          </h2>
          <p className="text-xs text-[#717376] dark:text-[#9A9CA0]">
            These items automatically preload into new sessions. Customize them to fit your physical desk setup.
          </p>

          <div className="space-y-4 text-xs">
            {/* Space block items */}
            <div className="space-y-2">
              <label className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Physical Space Checklist
              </label>
              <div className="flex flex-wrap gap-1.5">
                {spaceList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-[#1E2023] border border-[#E0E0DA] dark:border-[#2E3136] text-[11px]"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => setSpaceList(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[#A0A2A5] hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add default space check..."
                  value={newSpaceText}
                  onChange={e => setNewSpaceText(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-lg border bg-white dark:bg-[#141517]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSpaceText.trim()) {
                      setSpaceList(prev => [...prev, newSpaceText.trim()]);
                      setNewSpaceText('');
                    }
                  }}
                  className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Closing items */}
            <div className="space-y-2 pt-3 border-t border-[#EAEAE4] dark:border-[#26282B]">
              <label className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] block">
                Closing & Preservation Checklist
              </label>
              <div className="flex flex-wrap gap-1.5">
                {closingList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-[#1E2023] border border-[#E0E0DA] dark:border-[#2E3136] text-[11px]"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => setClosingList(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[#A0A2A5] hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add default closing check..."
                  value={newClosingText}
                  onChange={e => setNewClosingText(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-lg border bg-white dark:bg-[#141517]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newClosingText.trim()) {
                      setClosingList(prev => [...prev, newClosingText.trim()]);
                      setNewClosingText('');
                    }
                  }}
                  className="px-3 py-2 bg-[#2D5A46] text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DATA RESET & MAINTENANCE */}
        <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-xs font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
              Reset Demo Records
            </h3>
            <p className="text-[11px] text-[#717376] dark:text-[#9A9CA0]">
              Restore sample study sessions and goals for this account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E5DF] dark:border-[#26282B] rounded-xl text-xs font-semibold text-[#505255] hover:text-red-600 dark:text-[#A0A2A5] shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Save Changes Floating Action */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#2D5A46] hover:bg-[#204233] text-white text-xs font-bold rounded-xl shadow-md transition-all transform active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Demo Records"
        description="Are you sure you want to restore sample study sessions and goals for this account? Any recent session adjustments will be reset."
        confirmLabel="Reset Demo Data"
        isDestructive={false}
        onConfirm={() => {
          resetUserDemoData();
          setSaveMessage('Demo sessions successfully restored.');
          setTimeout(() => setSaveMessage(''), 3000);
        }}
        onClose={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
