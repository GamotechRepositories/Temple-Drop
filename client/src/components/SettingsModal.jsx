import React from 'react';
import {
  X,
  Volume2,
  Music,
  Zap,
  FileText,
  History,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager.js';

export const SettingsModal = ({
  isOpen,
  onClose,
  user,
  preferences,
  onUpdatePreferences,
  onOpenRules,
  onOpenHistory,
  onOpenAuth,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div
        className="rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full relative shadow-2xl max-h-[82dvh] flex flex-col transition-all overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0b162a 0%, #060d1a 100%)',
          border: '2.5px solid #d97706',
          boxShadow:
            '0 24px 50px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-950 rounded-full transition-all hover:brightness-110 active:scale-95 z-10"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Profile Header */}
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-slate-800/80 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300 shrink-0">
            <UserIcon className="w-6 h-6 text-slate-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-sm truncate" title={user?.email || 'Demo Explorer'}>
              {user?.email || 'Demo Explorer'}
            </h3>
            <div className="flex items-center space-x-1.5 mt-1">
              {user?.isGuest ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                  Guest Demo
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 inline" />
                  <span>Verified Account</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body (Choose Avatar REMOVED per user request) */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
          {/* Audio & Visual Preferences Card */}
          <div className="bg-[#0b121e]/80 rounded-2xl p-3.5 sm:p-4 border border-slate-800/90 space-y-3 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Game Preferences
            </span>

            {/* Sound Effects */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
                  <Volume2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Sound Effects</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.soundEnabled}
                onClick={() => {
                  soundManager.playButtonClick();
                  soundManager.setSoundEnabled(!preferences.soundEnabled);
                  onUpdatePreferences({ soundEnabled: !preferences.soundEnabled });
                }}
                className="w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex items-center"
                style={{
                  background: preferences.soundEnabled
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)'
                    : '#0f172a',
                  border: preferences.soundEnabled ? '1.5px solid #fef08a' : '1.5px solid #d97706',
                  boxShadow: preferences.soundEnabled ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    preferences.soundEnabled ? 'translate-x-4 bg-white' : 'translate-x-0 bg-amber-300'
                  }`}
                />
              </button>
            </div>

            {/* Temple Ambient Music */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
                  <Music className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Temple Ambient Music</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.musicEnabled}
                onClick={() => {
                  soundManager.playButtonClick();
                  soundManager.setMusicEnabled(!preferences.musicEnabled);
                  onUpdatePreferences({ musicEnabled: !preferences.musicEnabled });
                }}
                className="w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex items-center"
                style={{
                  background: preferences.musicEnabled
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)'
                    : '#0f172a',
                  border: preferences.musicEnabled ? '1.5px solid #fef08a' : '1.5px solid #d97706',
                  boxShadow: preferences.musicEnabled ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    preferences.musicEnabled ? 'translate-x-4 bg-white' : 'translate-x-0 bg-amber-300'
                  }`}
                />
              </button>
            </div>

            {/* Fast Mode */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Fast Mode</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.fastMode}
                onClick={() => {
                  soundManager.playButtonClick();
                  onUpdatePreferences({ fastMode: !preferences.fastMode });
                }}
                className="w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex items-center"
                style={{
                  background: preferences.fastMode
                    ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)'
                    : '#0f172a',
                  border: preferences.fastMode ? '1.5px solid #fef08a' : '1.5px solid #d97706',
                  boxShadow: preferences.fastMode ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    preferences.fastMode ? 'translate-x-4 bg-white' : 'translate-x-0 bg-amber-300'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Navigation Links (Dark navy cards with golden borders matching reference) */}
          <div className="space-y-2.5">
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenRules();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0b1426] hover:bg-[#101c34] border-2 border-amber-600 text-xs font-bold text-slate-100 transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Game Rules & Limits</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 transition-all" />
            </button>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenHistory();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0b1426] hover:bg-[#101c34] border-2 border-amber-600 text-xs font-bold text-slate-100 transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <History className="w-4 h-4" />
                </div>
                <span>My Bet History</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 transition-all" />
            </button>
          </div>

          {/* Sign In / Save Progress or Logout Button */}
          <div className="pt-1">
            {user?.isGuest ? (
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
                  border: '2px solid #fef08a',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
                }}
              >
                <UserIcon className="w-4 h-4 text-slate-950" />
                <span>Save Progress / Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onLogout();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 hover:brightness-110 active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
                  border: '2px solid #fef08a',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
