import React, { useState } from 'react';
import { X, Lock, Mail, Sparkles, RefreshCw, Crown } from 'lucide-react';
import { api } from '../api/client.js';
import { soundManager } from '../audio/soundManager.js';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.playButtonClick();

    try {
      let data;
      if (tab === 'login') {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password);
      }
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    soundManager.playButtonClick();

    try {
      const data = await api.guestLogin();
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to start demo session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl p-6 max-w-sm w-full relative shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #0c172c 0%, #070e1c 100%)',
          border: '2.5px solid #d97706',
          boxShadow:
            '0 24px 50px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-950 rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-glow-gold border border-amber-300 mb-2">
            <Crown className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider">
            Temple Drop
          </h2>
          <span className="text-xs text-teal-400 font-semibold tracking-widest uppercase">
            Player Account
          </span>
        </div>

        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setTab('login');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setTab('register');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="explorer@temple.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
            }}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-semibold">Or</span>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGuestLogin}
          className="w-full py-2.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
          }}
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Play as Demo Guest (10,000 ₹)</span>
        </button>
      </div>
    </div>
  );
};
