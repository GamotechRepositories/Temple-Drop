import React, { useEffect, useState, useCallback } from 'react';
import {
  Home,
  Settings,
  Gift,
  Coins,
  Wallet,
  History,
  Layers,
  ShieldCheck,
  Save,
  Play,
  Upload,
  RefreshCw,
  LogOut,
  Menu,
  X,
  UserPlus,
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Server,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { adminApi } from './api/adminClient.js';
import { Panel, NumberField, PasswordInput, SearchInput, Modal } from './components/UiPrimitives.jsx';
import {
  GameSettingsView,
  FreeSpinView,
  PayoutProfitView,
  ConfigHistoryView,
  AdminAuditView,
} from './components/ConfigViews.jsx';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'game-settings', label: 'Game Settings', icon: Settings },
  { id: 'free-spin', label: 'Free Spin', icon: Gift },
  { id: 'payout-profit', label: 'Payout & Profit', icon: Coins },
  { id: 'players-wallet', label: 'Players & Wallet', icon: Wallet },
  { id: 'providers', label: 'Providers', icon: Server },
  { id: 'round-history', label: 'Round History', icon: History },
  { id: 'config-history', label: 'Config History', icon: Layers },
  { id: 'admin-audit', label: 'Admin Audit', icon: ShieldCheck },
];

const EMPTY_PROVIDER = {
  name: '',
  providerCode: '',
  providerApiUrl: 'https://api.dpbossking.com/api/v1',
  gameServerApiKey: '',
  gameCode: 'temple-drop',
  currency: 'INR',
  enabled: true,
  isDefault: false,
  notes: '',
};

const formatCredits = (cents) =>
  ((cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const App = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [activeTab, setActiveTab] = useState('free-spin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [banner, setBanner] = useState(null);

  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [players, setPlayers] = useState([]);
  const [payoutReport, setPayoutReport] = useState(null);
  const [configHistory, setConfigHistory] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Editable config state + live validation/preview
  const [publishedVersion, setPublishedVersion] = useState(1);
  const [hasDraft, setHasDraft] = useState(false);
  const [editableConfig, setEditableConfig] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedStakeCents, setSelectedStakeCents] = useState(50);
  const [selectedBallCount, setSelectedBallCount] = useState(10);

  // Publish modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishReason, setPublishReason] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Search queries
  const [playerQuery, setPlayerQuery] = useState('');
  const [roundQuery, setRoundQuery] = useState('');
  const [providerQuery, setProviderQuery] = useState('');

  // Provider / Player / Wallet / Password modals
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerForm, setProviderForm] = useState(EMPTY_PROVIDER);
  const [savingProvider, setSavingProvider] = useState(false);

  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [playerForm, setPlayerForm] = useState({ email: '', password: '', initialCredits: '1000', avatarId: 'explorer' });
  const [savingPlayer, setSavingPlayer] = useState(false);

  const [walletModalPlayer, setWalletModalPlayer] = useState(null);
  const [walletForm, setWalletForm] = useState({ action: 'CREDIT', amountCredits: '100', reason: '' });
  const [savingWallet, setSavingWallet] = useState(false);

  const [passwordModalPlayer, setPasswordModalPlayer] = useState(null);
  const [newPlayerPassword, setNewPlayerPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [playerDetailsModal, setPlayerDetailsModal] = useState(null);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState(false);

  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 5000);
  };

  const loadDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const [statsRes, providersRes, roundsRes, playersRes, cfgRes, reportRes, histRes, auditRes] =
        await Promise.all([
          adminApi.getStats(),
          adminApi.listProviders(),
          adminApi.listRounds(50),
          adminApi.listPlayers(100),
          adminApi.getConfigState(),
          adminApi.getPayoutReport(),
          adminApi.getConfigHistory(),
          adminApi.getAuditLogs(100),
        ]);

      setStats(statsRes);
      setProviders(providersRes.providers || []);
      setRounds(roundsRes.rounds || []);
      setPlayers(playersRes.players || []);
      setPayoutReport(reportRes);
      setConfigHistory(histRes.versions || []);
      setAuditLogs(auditRes.logs || []);

      if (cfgRes?.current) {
        setPublishedVersion(cfgRes.published?.version || 1);
        setHasDraft(Boolean(cfgRes.hasDraft));
        setEditableConfig(cfgRes.current);
        setSelectedStakeCents(cfgRes.current.defaultBetPerBallCents || 50);
        setSelectedBallCount(cfgRes.current.defaultBallsPerDrop || 10);
        setPreviewData({ valid: true, errors: [], estimate: cfgRes.estimate });
      }
    } catch (err) {
      showBanner('error', err.message || 'Failed to load admin dashboard');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await adminApi.me();
        if (me?.authenticated) {
          setAdminUser(me.username);
          await loadDashboard();
        }
      } catch {
        setAdminUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [loadDashboard]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await adminApi.login(loginForm.username, loginForm.password);
      setAdminUser(res.username || 'admin');
      await loadDashboard();
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await adminApi.logout();
    setAdminUser(null);
  };

  const handleSaveDraft = async () => {
    if (!editableConfig) return;
    try {
      const payload = { ...editableConfig, baseVersion: publishedVersion };
      const res = await adminApi.saveConfigDraft(payload);
      setEditableConfig(res.draft);
      setHasDraft(true);
      showBanner('success', `Saved draft (base v${publishedVersion})`);
      const [histRes, auditRes] = await Promise.all([
        adminApi.getConfigHistory(),
        adminApi.getAuditLogs(100),
      ]);
      setConfigHistory(histRes.versions || []);
      setAuditLogs(auditRes.logs || []);
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const handleValidateAndPreview = async (
    stakeOverride = selectedStakeCents,
    ballsOverride = selectedBallCount
  ) => {
    if (!editableConfig) return;
    try {
      const res = await adminApi.previewConfig(editableConfig, stakeOverride, ballsOverride);
      setPreviewData(res);
      setValidationErrors(res.errors || []);
      if (res.valid) {
        showBanner('success', 'Configuration valid — preview updated');
      } else {
        showBanner('error', `Validation failed (${res.errors.length} issue(s))`);
      }
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const handlePublishDirect = async () => {
    if (!editableConfig || publishing) return;
    setPublishing(true);
    try {
      const baseVer =
        editableConfig.status === 'DRAFT' && editableConfig.baseVersion > 0
          ? editableConfig.baseVersion
          : publishedVersion;
      const reason = publishReason.trim() || `Published configuration v${baseVer + 1}`;
      const res = await adminApi.publishConfig(baseVer, reason, editableConfig);
      setPublishModalOpen(false);
      setPublishReason('');
      setValidationErrors([]);
      showBanner('success', `Published configuration v${res.published.version}`);
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    await handlePublishDirect();
  };

  const handleCompareConfigs = async (v1, v2) => {
    try {
      const res = await adminApi.compareConfigs(v1, v2);
      setCompareResult(res);
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setSavingPlayer(true);
    try {
      const creditsNum = Number(playerForm.initialCredits);
      const initialBalanceCents =
        Number.isFinite(creditsNum) && creditsNum >= 0 ? Math.round(creditsNum * 100) : 100000;
      await adminApi.createPlayer({
        email: playerForm.email,
        password: playerForm.password,
        initialBalanceCents,
        avatarId: playerForm.avatarId || 'explorer',
      });
      showBanner('success', `Created player "${playerForm.email}"`);
      setPlayerModalOpen(false);
      setPlayerForm({ email: '', password: '', initialCredits: '1000', avatarId: 'explorer' });
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setSavingPlayer(false);
    }
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!walletModalPlayer) return;
    setSavingWallet(true);
    try {
      const amountNum = Number(walletForm.amountCredits);
      if (!Number.isFinite(amountNum) || amountNum < 0) throw new Error('Enter a valid amount');
      await adminApi.adjustPlayerWallet(walletModalPlayer.id, {
        action: walletForm.action,
        amountCents: Math.round(amountNum * 100),
        reason: walletForm.reason,
      });
      showBanner('success', `Wallet updated for ${walletModalPlayer.email}`);
      setWalletModalPlayer(null);
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setSavingWallet(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordModalPlayer) return;
    setSavingPassword(true);
    try {
      await adminApi.resetPlayerPassword(passwordModalPlayer.id, newPlayerPassword);
      showBanner('success', `Password updated for ${passwordModalPlayer.email}`);
      setPasswordModalPlayer(null);
      setNewPlayerPassword('');
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      if (editingProvider) {
        await adminApi.updateProvider(editingProvider.id, providerForm);
        showBanner('success', `Updated provider ${providerForm.name}`);
      } else {
        await adminApi.createProvider(providerForm);
        showBanner('success', `Added provider ${providerForm.name}`);
      }
      setProviderModalOpen(false);
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (p) => {
    if (!window.confirm(`Delete provider "${p.name}" (${p.providerCode})?`)) return;
    try {
      await adminApi.deleteProvider(p.id);
      showBanner('success', `Deleted ${p.name}`);
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const openPlayerDetails = async (player) => {
    setLoadingPlayerDetails(true);
    setPlayerDetailsModal({ player, summary: null, rounds: [] });
    try {
      const data = await adminApi.getPlayerDetails(player.id);
      setPlayerDetailsModal(data);
    } catch (err) {
      setPlayerDetailsModal(null);
      showBanner('error', err.message || 'Failed to load player details');
    } finally {
      setLoadingPlayerDetails(false);
    }
  };

  const handleToggleProviderEnabled = async (provider) => {
    try {
      await adminApi.updateProvider(provider.id, {
        name: provider.name,
        providerCode: provider.providerCode,
        providerApiUrl: provider.providerApiUrl,
        gameCode: provider.gameCode,
        currency: provider.currency,
        enabled: !provider.enabled,
        isDefault: provider.isDefault,
        notes: provider.notes,
      });
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const handleSetDefaultProvider = async (provider) => {
    try {
      await adminApi.updateProvider(provider.id, {
        name: provider.name,
        providerCode: provider.providerCode,
        providerApiUrl: provider.providerApiUrl,
        gameCode: provider.gameCode,
        currency: provider.currency,
        enabled: true,
        isDefault: true,
        notes: provider.notes,
      });
      showBanner('success', `"${provider.name}" is now the default provider`);
      await loadDashboard();
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-slate-300 text-xs">
        Loading Temple Drop Admin...
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-lg border border-white/[0.12] bg-[#131822] p-6 space-y-5 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <ScarabEmblem />
            <div>
              <div className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
                Temple Drop Admin
              </div>
              <div className="text-[11px] text-slate-400">Egyptian Plinko Internal Backoffice</div>
            </div>
          </div>

          {loginError && (
            <div className="rounded border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
              {loginError}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Username</label>
              <input
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white focus:border-rose-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Password</label>
              <PasswordInput
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loginBusy ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const isConfigTab = ['game-settings', 'free-spin', 'payout-profit'].includes(activeTab);
  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab);

  const nPlayerQ = playerQuery.trim().toLowerCase();
  const filteredPlayers = nPlayerQ
    ? players.filter((pl) =>
        [pl.email, pl.id, pl.isGuest ? 'guest' : 'registered', formatCredits(pl.balanceCents)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(nPlayerQ))
      )
    : players;

  const nRoundQ = roundQuery.trim().toLowerCase();
  const filteredRounds = nRoundQ
    ? rounds.filter((r) =>
        [r.roundId, r.type, r.ballCount, formatCredits(r.totalBetCents), formatCredits(r.totalPayoutCents)]
          .filter((v) => v !== null && v !== undefined)
          .some((v) => String(v).toLowerCase().includes(nRoundQ))
      )
    : rounds;

  const nProviderQ = providerQuery.trim().toLowerCase();
  const filteredProviders = nProviderQ
    ? providers.filter((p) =>
        [p.name, p.providerCode, p.providerApiUrl, p.gameCode, p.currency]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(nProviderQ))
      )
    : providers;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#10141d] px-4 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden rounded-lg border border-white/[0.08] p-1.5 text-white"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <ScarabEmblem />
          <div className="truncate">
            <div className="text-sm font-bold tracking-wide text-white leading-tight">
              TEMPLE DROP ADMIN
            </div>
            <div className="hidden sm:block text-[11px] text-slate-400 leading-tight">
              Enterprise Risk Management &amp; Game Ledger
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0b0e14] px-3 py-1 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Config</span>
            <span className="font-mono font-semibold text-white">v{publishedVersion}</span>
          </div>
          <div className="hidden sm:block text-right leading-tight pr-1">
            <div className="text-xs font-medium text-white">{adminUser}</div>
            <div className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
              SUPER ADMIN
            </div>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loadingData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#131822] px-2.5 py-1.5 text-xs text-slate-200 hover:border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#131822] px-2.5 py-1.5 text-xs text-slate-200 hover:text-rose-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/75 lg:hidden"
          />
        )}

        {/* Sticky Collapsible Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-56 h-[calc(100vh-3.5rem)] top-14 bg-[#10141d] border-r border-white/[0.08] flex flex-col shrink-0 transition-transform duration-150 lg:sticky lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 lg:hidden border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-rose-400">Navigation</span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Platform Controls
          </div>
          <nav className="flex-1 px-2.5 py-1.5 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-rose-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="m-3 rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3 text-[11px] text-slate-400 space-y-0.5">
            <div className="font-medium text-slate-200">Temple Drop Engine</div>
            <div>Admin: <span className="text-emerald-400 font-medium">{adminUser}</span></div>
            <div>Config: <span className="text-amber-400 font-mono">v{publishedVersion}</span></div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-4">
          {/* Sub-header with Title, Draft/Published pill, and Config Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {currentNav?.id === 'free-spin' ? 'Free Spin Settings' : currentNav?.label}
              </h1>
              {isConfigTab && (
                <span
                  className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-xs font-medium ${
                    hasDraft
                      ? 'border-white/[0.12] bg-amber-500/15 text-amber-400'
                      : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {hasDraft ? `Draft (base v${publishedVersion})` : `Published v${publishedVersion}`}
                </span>
              )}
            </div>

            {isConfigTab && editableConfig && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 rounded border border-white/[0.12] bg-[#131822] px-3 py-1.5 text-xs font-medium text-white hover:border-white/25"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateAndPreview()}
                  className="inline-flex items-center gap-1.5 rounded border border-white/[0.12] bg-[#131822] px-3 py-1.5 text-xs font-medium text-white hover:border-emerald-400"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Validate & Preview
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublishDirect}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            )}
          </div>

          {banner && (
            <div
              className={`rounded-md border px-4 py-2.5 text-xs ${
                banner.type === 'error'
                  ? 'border-red-500/45 bg-red-950/50 text-red-200'
                  : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
              }`}
            >
              {banner.text}
            </div>
          )}

          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <OverviewCard label="Total Players" value={stats?.totalUsers ?? 0} sub="Virtual demo accounts" />
                <OverviewCard label="Total Rounds" value={stats?.totalRounds ?? 0} sub="Settled paid drops" />
                <OverviewCard
                  label="Global RTP (All Players)"
                  value={`${(payoutReport?.historicalRtpPct ?? 0).toFixed(2)}%`}
                  sub={`${payoutReport?.totalRounds ?? 0} settled · Net: ${formatCredits(payoutReport?.netCreditsCents)}`}
                  highlight
                />
                <OverviewCard
                  label="Pending Free Spins"
                  value={payoutReport?.pendingSpinsCount ?? 0}
                  sub={payoutReport?.hasIncompletePeriods ? 'Incomplete period' : 'All settled'}
                />
              </div>

              <Panel
                title="Connected Game Providers"
                subtitle="Provider SDK endpoints used by in.oreng:game-sdk & @gamotech/game-sdk-client"
                right={
                  <button
                    onClick={() => {
                      setEditingProvider(null);
                      setProviderForm({ ...EMPTY_PROVIDER, isDefault: providers.length === 0 });
                      setProviderModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Provider
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
                      <tr>
                        <th className="px-3 py-2">Provider</th>
                        <th className="px-3 py-2">API URL</th>
                        <th className="px-3 py-2">API Key</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {providers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                            No providers configured yet.
                          </td>
                        </tr>
                      ) : (
                        providers.map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2 font-medium text-white">
                              {p.name} <span className="text-[11px] font-mono text-slate-400">({p.providerCode})</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-300">{p.providerApiUrl}</td>
                            <td className="px-3 py-2 font-mono text-slate-400">{p.maskedApiKey || 'Not set'}</td>
                            <td className="px-3 py-2 text-emerald-400">{p.enabled ? 'Enabled' : 'Disabled'}</td>
                            <td className="px-3 py-2 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingProvider(p);
                                  setProviderForm({ ...p, gameServerApiKey: '' });
                                  setProviderModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(p)}
                                className="p-1 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {/* 2. GAME SETTINGS */}
          {activeTab === 'game-settings' && editableConfig && (
            <GameSettingsView
              config={editableConfig}
              onChange={setEditableConfig}
              validationErrors={validationErrors}
            />
          )}

          {/* 3. FREE SPIN */}
          {activeTab === 'free-spin' && editableConfig && (
            <FreeSpinView
              config={editableConfig}
              onChange={setEditableConfig}
              previewData={previewData}
              validationErrors={validationErrors}
            />
          )}

          {/* 4. PAYOUT & PROFIT */}
          {activeTab === 'payout-profit' && editableConfig && (
            <PayoutProfitView
              config={editableConfig}
              onChange={setEditableConfig}
              previewData={previewData}
              selectedStakeCents={selectedStakeCents}
              selectedBallCount={selectedBallCount}
              onSelectStake={(s) => {
                setSelectedStakeCents(s);
                handleValidateAndPreview(s, selectedBallCount);
              }}
              onSelectBalls={(b) => {
                setSelectedBallCount(b);
                handleValidateAndPreview(selectedStakeCents, b);
              }}
              payoutReport={payoutReport}
            />
          )}

          {/* 5. PLAYERS & WALLET */}
          {activeTab === 'players-wallet' && (
            <Panel
              title="Players & Wallet Management"
              subtitle={`Showing ${filteredPlayers.length} of ${players.length} players · Adjustments write ledger entries with Admin ID & Reason`}
              right={
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    value={playerQuery}
                    onChange={setPlayerQuery}
                    placeholder="Search player email, ID..."
                  />
                  <button
                    onClick={() => setPlayerModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create Player
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
                    <tr>
                      <th className="px-3 py-2">Player</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-right">Balance (Demo)</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredPlayers.map((pl) => (
                      <tr key={pl.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-white">{pl.email}</div>
                          <div className="text-[11px] font-mono text-slate-400">{pl.id}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-300">{pl.isGuest ? 'Guest' : 'Registered'}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                          {formatCredits(pl.balanceCents)}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {pl.createdAt ? new Date(pl.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-right space-x-1.5">
                          <button
                            onClick={() => openPlayerDetails(pl)}
                            className="inline-flex items-center gap-1 rounded border border-white/[0.10] px-2 py-1 text-[11px] text-white hover:border-emerald-400"
                          >
                            <Eye className="w-3 h-3 text-emerald-400" /> Details
                          </button>
                          <button
                            onClick={() => {
                              setWalletModalPlayer(pl);
                              setWalletForm({ action: 'CREDIT', amountCredits: '100', reason: '' });
                            }}
                            className="inline-flex items-center gap-1 rounded border border-white/[0.10] px-2 py-1 text-[11px] text-emerald-400 hover:border-emerald-400"
                          >
                            <Wallet className="w-3 h-3" /> Wallet
                          </button>
                          <button
                            onClick={() => {
                              setPasswordModalPlayer(pl);
                              setNewPlayerPassword('');
                            }}
                            className="inline-flex items-center gap-1 rounded border border-white/[0.08] px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                          >
                            <KeyRound className="w-3 h-3" /> Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* PROVIDERS (Separate Sidebar Tab with full original Provider logic) */}
          {activeTab === 'providers' && (
            <Panel
              title="Game Providers"
              subtitle={`Manage Provider API URLs & Server API Keys (${filteredProviders.length} of ${providers.length})`}
              right={
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    value={providerQuery}
                    onChange={setProviderQuery}
                    placeholder="Search providers..."
                  />
                  <button
                    onClick={() => {
                      setEditingProvider(null);
                      setProviderForm({ ...EMPTY_PROVIDER, isDefault: providers.length === 0 });
                      setProviderModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Provider
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
                    <tr>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">API Base URL</th>
                      <th className="px-3 py-2">API Key</th>
                      <th className="px-3 py-2">Game / Currency</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredProviders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                          {providers.length === 0
                            ? 'No providers configured yet. Click Add Provider to connect one.'
                            : 'No providers match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProviders.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{p.name}</span>
                              {p.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" /> Default
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{p.providerCode}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-300">{p.providerApiUrl}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">
                            {p.hasApiKey ? p.maskedApiKey : <span className="text-amber-400">Not set</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            {p.gameCode} · {p.currency}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleToggleProviderEnabled(p)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                                p.enabled
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {p.enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {p.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {!p.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultProvider(p)}
                                  className="rounded border border-white/[0.10] px-2 py-1 text-[11px] text-amber-400 hover:border-white/25"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingProvider(p);
                                  setProviderForm({
                                    name: p.name || '',
                                    providerCode: p.providerCode || '',
                                    providerApiUrl: p.providerApiUrl || '',
                                    gameServerApiKey: '',
                                    gameCode: p.gameCode || 'temple-drop',
                                    currency: p.currency || 'INR',
                                    enabled: Boolean(p.enabled),
                                    isDefault: Boolean(p.isDefault),
                                    notes: p.notes || '',
                                  });
                                  setProviderModalOpen(true);
                                }}
                                title="Edit Provider"
                                className="rounded border border-white/[0.08] p-1.5 text-slate-300 hover:text-white"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(p)}
                                title="Delete Provider"
                                className="rounded border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/15"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* 6. ROUND HISTORY */}
          {activeTab === 'round-history' && (
            <Panel
              title="Round History"
              subtitle={`Showing ${filteredRounds.length} of ${rounds.length} recorded rounds`}
              right={
                <SearchInput
                  value={roundQuery}
                  onChange={setRoundQuery}
                  placeholder="Search round ID, type, bet..."
                />
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
                    <tr>
                      <th className="px-3 py-2">Round ID</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-right">Balls</th>
                      <th className="px-3 py-2 text-right">Bet</th>
                      <th className="px-3 py-2 text-right">Payout</th>
                      <th className="px-3 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredRounds.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-white">{r.roundId}</td>
                        <td className="px-3 py-2 text-slate-300">{r.type}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.ballCount}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCredits(r.totalBetCents)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                          {formatCredits(r.totalPayoutCents)}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* 7. CONFIG HISTORY */}
          {activeTab === 'config-history' && (
            <ConfigHistoryView
              versions={configHistory}
              onCompare={handleCompareConfigs}
              compareResult={compareResult}
            />
          )}

          {/* 8. ADMIN AUDIT */}
          {activeTab === 'admin-audit' && <AdminAuditView logs={auditLogs} />}
        </main>
      </div>

      {/* Player Details Modal (Player's own bets, payouts, winning drops & settled rounds) */}
      {playerDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/[0.1] bg-[#131822] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Player Details — {playerDetailsModal.player?.email}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  ID: {playerDetailsModal.player?.id} · Balance: {formatCredits(playerDetailsModal.player?.balanceCents)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerDetailsModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {loadingPlayerDetails || !playerDetailsModal.summary ? (
                <div className="py-10 text-center text-xs text-slate-400">Loading player stats...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Total Rounds</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {playerDetailsModal.summary.totalRounds}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Total Bets</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {formatCredits(playerDetailsModal.summary.totalBetCents)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Total Payouts</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {formatCredits(playerDetailsModal.summary.totalGrossPayoutCents)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Winning Drops</div>
                      <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                        {playerDetailsModal.summary.winningDropsCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Player RTP</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {Number(playerDetailsModal.summary.playerRtpPct || 0).toFixed(2)}%
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-[#0b0e14] p-3">
                      <div className="text-[11px] text-slate-400">Pending Spins</div>
                      <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                        {playerDetailsModal.summary.pendingSpinsCount}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
                        <tr>
                          <th className="px-3 py-2">Round ID</th>
                          <th className="px-3 py-2">Config</th>
                          <th className="px-3 py-2 text-right">Winning Drops</th>
                          <th className="px-3 py-2 text-right">Bet</th>
                          <th className="px-3 py-2 text-right">Board</th>
                          <th className="px-3 py-2 text-right">Free Spin</th>
                          <th className="px-3 py-2 text-right">Total Payout</th>
                          <th className="px-3 py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] bg-[#0b0e14]/40">
                        {playerDetailsModal.rounds.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                              No settled rounds for this player yet.
                            </td>
                          </tr>
                        ) : (
                          playerDetailsModal.rounds.map((r) => (
                            <tr key={r.id}>
                              <td className="px-3 py-2 font-mono text-white">{r.roundId}</td>
                              <td className="px-3 py-2 font-mono text-slate-400">
                                {r.configVersion ? `v${r.configVersion}` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-amber-400">
                                {r.winningDropsCount} / {r.ballCount}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{formatCredits(r.totalBetCents)}</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-300">
                                {formatCredits(r.boardPayoutCents)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-300">
                                {formatCredits(r.wheelPayoutCents)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400">
                                {formatCredits(r.totalGrossPayoutCents)}
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Config Modal */}
      {publishModalOpen && (
        <Modal
          title={`Publish Configuration (v${publishedVersion} → v${publishedVersion + 1})`}
          subtitle="A publish reason is required and will be recorded in Config History & Admin Audit."
          onClose={() => setPublishModalOpen(false)}
        >
          <form onSubmit={handlePublish} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Publish Reason</label>
              <input
                required
                value={publishReason}
                onChange={(e) => setPublishReason(e.target.value)}
                placeholder="e.g., Adjust Free Spin weights for holiday promo"
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white focus:border-rose-500/60 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="rounded border border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {publishing ? 'Publishing...' : 'Confirm Publish'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Player Modal */}
      {playerModalOpen && (
        <Modal title="Create Player Login" onClose={() => setPlayerModalOpen(false)}>
          <form onSubmit={handleCreatePlayer} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Email / Username</label>
              <input
                required
                value={playerForm.email}
                onChange={(e) => setPlayerForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="player1@temple.com"
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Password (min 6 chars)</label>
              <PasswordInput
                required
                minLength={6}
                value={playerForm.password}
                onChange={(e) => setPlayerForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Initial Wallet Balance (Credits)</label>
              <NumberField
                required
                min="0"
                step="0.01"
                value={playerForm.initialCredits}
                onChange={(e) => setPlayerForm((p) => ({ ...p, initialCredits: e.target.value }))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlayerModalOpen(false)}
                className="rounded border border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPlayer}
                className="rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950"
              >
                {savingPlayer ? 'Creating...' : 'Create Player'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Wallet Modal */}
      {walletModalPlayer && (
        <Modal
          title="Manage Player Wallet"
          subtitle={`${walletModalPlayer.email} · Balance: ${formatCredits(walletModalPlayer.balanceCents)}`}
          onClose={() => setWalletModalPlayer(null)}
        >
          <form onSubmit={handleAdjustWallet} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Action</label>
              <select
                value={walletForm.action}
                onChange={(e) => setWalletForm((p) => ({ ...p, action: e.target.value }))}
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
              >
                <option value="CREDIT">Credit (+ Add Demo Credits)</option>
                <option value="DEBIT">Debit (- Deduct Demo Credits)</option>
                <option value="SET">Set Exact Balance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Amount (Credits)</label>
              <NumberField
                required
                min="0"
                step="0.01"
                value={walletForm.amountCredits}
                onChange={(e) => setWalletForm((p) => ({ ...p, amountCredits: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Reason (Recorded in Ledger)</label>
              <input
                required
                value={walletForm.reason}
                onChange={(e) => setWalletForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Support adjustment / bonus demo credits"
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWalletModalPlayer(null)}
                className="rounded border border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingWallet}
                className="rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950"
              >
                {savingWallet ? 'Updating...' : 'Update Wallet'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {passwordModalPlayer && (
        <Modal
          title="Reset Player Password"
          subtitle={passwordModalPlayer.email}
          onClose={() => setPasswordModalPlayer(null)}
        >
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 mb-1">New Password (min 6 chars)</label>
              <PasswordInput
                required
                minLength={6}
                value={newPlayerPassword}
                onChange={(e) => setNewPlayerPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasswordModalPlayer(null)}
                className="rounded border border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950"
              >
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Provider Modal */}
      {providerModalOpen && (
        <Modal
          title={editingProvider ? 'Edit Provider' : 'Add New Provider'}
          onClose={() => setProviderModalOpen(false)}
        >
          <form onSubmit={handleSaveProvider} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Provider Name</label>
                <input
                  required
                  value={providerForm.name}
                  onChange={(e) => setProviderForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="DPBoss King"
                  className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Provider Code</label>
                <input
                  required
                  value={providerForm.providerCode}
                  onChange={(e) => setProviderForm((p) => ({ ...p, providerCode: e.target.value }))}
                  placeholder="dpbossking"
                  className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Provider API Base URL</label>
              <input
                required
                type="url"
                value={providerForm.providerApiUrl}
                onChange={(e) => setProviderForm((p) => ({ ...p, providerApiUrl: e.target.value }))}
                placeholder="https://api.dpbossking.com/api/v1"
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Game Server API Key {editingProvider ? '(leave blank to keep existing)' : ''}
              </label>
              <PasswordInput
                value={providerForm.gameServerApiKey}
                onChange={(e) => setProviderForm((p) => ({ ...p, gameServerApiKey: e.target.value }))}
                placeholder="sk_live_..."
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Game Code</label>
                <input
                  value={providerForm.gameCode}
                  onChange={(e) => setProviderForm((p) => ({ ...p, gameCode: e.target.value }))}
                  className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Currency</label>
                <input
                  value={providerForm.currency}
                  onChange={(e) => setProviderForm((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Notes</label>
              <input
                value={providerForm.notes}
                onChange={(e) => setProviderForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional operator/environment notes"
                className="w-full rounded border border-white/[0.08] bg-[#0b0e14] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={providerForm.enabled}
                  onChange={(e) => setProviderForm((p) => ({ ...p, enabled: e.target.checked }))}
                />
                Enabled
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={providerForm.isDefault}
                  onChange={(e) => setProviderForm((p) => ({ ...p, isDefault: e.target.checked }))}
                />
                Set as Default Provider
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProviderModalOpen(false)}
                className="rounded border border-white/[0.08] px-3.5 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProvider}
                className="rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950"
              >
                {savingProvider ? 'Saving...' : editingProvider ? 'Save Changes' : 'Create Provider'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const ScarabEmblem = () => (
  <img
    src="/images/temple-scarab.png"
    alt="Temple Drop"
    className="h-8 w-8 rounded-lg object-contain shrink-0"
  />
);

const OverviewCard = ({ label, value, sub, highlight }) => (
  <div className="rounded-xl border border-white/[0.08] bg-[#131822] px-4 py-4">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
    <div
      className={`text-2xl font-bold font-mono tabular-nums mt-1.5 ${
        highlight ? 'text-amber-400' : 'text-white'
      }`}
    >
      {value}
    </div>
    <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
  </div>
);
