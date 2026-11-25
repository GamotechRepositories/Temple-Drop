import React from 'react';
import {
  X,
  Volume2,
  Music,
  Sliders,
  Zap,
  Eye,
  FileText,
  History,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { GAME_CONFIG } from '@temple-drop/shared';
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative shadow-2xl max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-all"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-glow-gold border border-amber-300">
            {GAME_CONFIG.AVATARS.find((a) => a.id === preferences.avatarId)?.icon || '🤠'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-sm truncate">
              {user?.email || 'Demo Explorer'}
            </h3>
            <div className="flex items-center space-x-2 mt-0.5">
              {user?.isGuest ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                  Guest Demo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
                  Verified Account
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Choose Avatar
            </span>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {GAME_CONFIG.AVATARS.map((av) => {
                const isSelected = preferences.avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    onClick={() => {
                      soundManager.playButtonClick();
                      onUpdatePreferences({ avatarId: av.id });
                    }}
                    title={av.name}
                    className={`p-2.5 rounded-2xl border text-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-glow-gold scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Volume2 className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-semibold text-slate-200">Sound Effects</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => {
                  soundManager.setSoundEnabled(e.target.checked);
                  onUpdatePreferences({ soundEnabled: e.target.checked });
                }}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Music className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-semibold text-slate-200">Temple Ambient Music</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.musicEnabled}
                onChange={(e) => {
                  soundManager.setMusicEnabled(e.target.checked);
                  onUpdatePreferences({ musicEnabled: e.target.checked });
                }}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-semibold text-slate-200">Ball Animations</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.animationEnabled}
                onChange={(e) => onUpdatePreferences({ animationEnabled: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">Fast Mode</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.fastMode}
                onChange={(e) => onUpdatePreferences({ fastMode: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Eye className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-semibold text-slate-200">Reduced Motion</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => onUpdatePreferences({ reducedMotion: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenRules();
              }}
              className="w-full flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-all"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Game Rules & Limits</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenHistory();
              }}
              className="w-full flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-all"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>My Bet History</span>
            </button>
          </div>

          <div className="pt-2">
            {user?.isGuest ? (
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>Save Progress / Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
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
