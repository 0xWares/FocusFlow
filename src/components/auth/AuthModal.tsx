/**
 * FocusFlow Authentication & Account Switcher Modal.
 * Provides clean Sign In and Create Account tabs with username and password.
 */

import React, { useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, Sparkles, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, canDismiss = true }) => {
  const { login, register, availableAccounts, switchUser, currentUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studyField, setStudyField] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Please enter a username');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(username.trim(), password);
        if (!res.ok) {
          setErrorMsg(res.error || 'Invalid username or password');
        } else {
          onClose();
        }
      } else {
        const res = await register(username.trim(), password, displayName.trim(), studyField.trim());
        if (!res.ok) {
          setErrorMsg(res.error || 'Registration failed');
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (targetUsername: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(targetUsername, 'focus123');
      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to switch user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FBFBF9] dark:bg-[#18191B] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transition-all text-left">
        {/* Header Banner */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5DF] dark:border-[#26282B] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D5A46] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
                {mode === 'login' ? 'Sign In to FocusFlow' : 'Create Student Account'}
              </h2>
              <p className="text-xs text-[#717376] dark:text-[#9A9CA0] mt-0.5">
                Multi-user deep work operating system
              </p>
            </div>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="text-[#717376] hover:text-[#1C1D1F] dark:text-[#9A9CA0] dark:hover:text-white p-1 rounded-lg hover:bg-[#F0EFEA] dark:hover:bg-[#202225] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E5E5DF] dark:border-[#26282B] bg-[#F0EFEA]/50 dark:bg-[#151618]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-[#2D5A46] text-[#2D5A46] dark:text-emerald-400 bg-[#FBFBF9] dark:bg-[#18191B]'
                : 'border-transparent text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-[#FBFBF9]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-[#2D5A46] text-[#2D5A46] dark:text-emerald-400 bg-[#FBFBF9] dark:bg-[#18191B]'
                : 'border-transparent text-[#717376] dark:text-[#9A9CA0] hover:text-[#1C1D1F] dark:hover:text-[#FBFBF9]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1.5">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717376]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alex or student_1"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E5DF] dark:border-[#26282B] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-[#FBFBF9] placeholder-[#9A9CA0] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46] focus:border-[#2D5A46]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717376]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min 4 characters)"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-[#E5E5DF] dark:border-[#26282B] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-[#FBFBF9] placeholder-[#9A9CA0] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46] focus:border-[#2D5A46]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#717376] hover:text-[#1C1D1F] dark:hover:text-[#FBFBF9]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1.5">
                    Your Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Marcus Aurelius"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DF] dark:border-[#26282B] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-[#FBFBF9] placeholder-[#9A9CA0] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46] focus:border-[#2D5A46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] mb-1.5">
                    Major / Study Field (Optional)
                  </label>
                  <input
                    type="text"
                    value={studyField}
                    onChange={e => setStudyField(e.target.value)}
                    placeholder="e.g. Cognitive Psychology & Neuroscience"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DF] dark:border-[#26282B] bg-white dark:bg-[#1E2023] text-[#1C1D1F] dark:text-[#FBFBF9] placeholder-[#9A9CA0] focus:outline-hidden focus:ring-1 focus:ring-[#2D5A46] focus:border-[#2D5A46]"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#2D5A46] hover:bg-[#254B3A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In & Enter OS' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-6 pt-5 border-t border-[#E5E5DF] dark:border-[#26282B]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#717376] dark:text-[#9A9CA0]">
                Quick Switch Accounts
              </span>
              <span className="text-[10px] text-[#9A9CA0]">Demo pass: focus123</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E5DF] dark:border-[#26282B] hover:border-[#2D5A46] dark:hover:border-emerald-500 bg-white dark:bg-[#1E2023] text-left transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#2D5A46] text-white font-semibold text-[10px] flex items-center justify-center shrink-0">
                  AC
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] truncate">
                    Alex Chen
                  </div>
                  <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] font-mono">
                    @alex
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sarah')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E5DF] dark:border-[#26282B] hover:border-[#2D5A46] dark:hover:border-emerald-500 bg-white dark:bg-[#1E2023] text-left transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-semibold text-[10px] flex items-center justify-center shrink-0">
                  SC
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9] truncate">
                    Sarah Connor
                  </div>
                  <div className="text-[10px] text-[#717376] dark:text-[#9A9CA0] font-mono">
                    @sarah
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
