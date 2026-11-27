import { ProviderGameSDK } from '@gamotech/game-sdk-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function parseLaunchSession(search = typeof window !== 'undefined' ? window.location.search : '') {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const token = params.get('token') || params.get('sessionToken');
  if (!token) return null;

  return {
    token,
    partnerCode: params.get('partner_code') || '',
    gid: params.get('gid') || '',
    gameCode: params.get('game_code') || 'temple-drop',
    username: params.get('username') || '',
    userId: params.get('user_id') || '',
    currency: params.get('currency') || 'INR',
    lang: (params.get('lang') || 'en').toLowerCase(),
    extsess: params.get('extsess') || '',
    closeUrl: params.get('close_url') || '',
  };
}

export function exitGame(closeUrl) {
  if (!closeUrl) return window.close();
  try {
    (window.top || window).location.href = closeUrl;
  } catch {
    window.location.href = closeUrl;
  }
}

class ProviderSdkBridge {
  constructor() {
    this.sdk = null;
    this.session = null;
    this.launchSession = null;
    this.authoritativeBalanceCents = null;
    this.initialized = false;
    this.tableCreated = false;
    this.activeRoundId = null;
  }

  getLaunchHeaders() {
    const launch = this.getLaunchSession();
    if (!launch?.token) return {};
    const headers = { 'X-Launch-Token': launch.token };
    if (launch.partnerCode) headers['X-Partner-Code'] = launch.partnerCode;
    if (launch.gid) headers['X-Launch-Gid'] = launch.gid;
    return headers;
  }

  hasSessionTokenInUrl() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('token') || params.get('sessionToken'));
  }

  getLaunchSession() {
    if (!this.launchSession) {
      this.launchSession = parseLaunchSession();
    }
    return this.launchSession;
  }

  isActive() {
    return this.initialized && Boolean(this.sdk) && Boolean(this.session);
  }

  async initIfPresent() {
    if (this.initialized || !this.hasSessionTokenInUrl()) {
      return null;
    }

    const launch = this.getLaunchSession();
    if (launch?.token) {
      // Forward launch session token to our game backend only (never call /api/v1/wallet/* from browser)
      try {
        const launchRes = await fetch(`${API_BASE}/api/game/launch/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(launch),
        });
        if (launchRes.ok) {
          const launchData = await launchRes.json();
          if (typeof launchData?.authoritativeBalanceCents === 'number') {
            this.authoritativeBalanceCents = launchData.authoritativeBalanceCents;
          }
        }
      } catch {
        // Best-effort launch registration
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (!params.get('sessionToken')) {
      this.initialized = true;
      return {
        ...launch,
        authoritativeBalanceCents: this.authoritativeBalanceCents,
      };
    }

    try {
      const res = await fetch(`${API_BASE}/api/game/provider-config`, {
        credentials: 'include',
      });
      if (!res.ok) return launch;
      const cfg = await res.json();
      if (!cfg?.enabled || !cfg?.providerApiUrl) return launch;

      this.sdk = new ProviderGameSDK({ apiBaseUrl: cfg.providerApiUrl });
      this.session = await this.sdk.initFromUrl();
      this.sdk.attachUnloadHandler();
      this.initialized = true;

      try {
        await this.sdk.createTable({
          gameCode: launch?.gameCode || cfg.gameCode || 'temple-drop',
        });
        this.tableCreated = true;
      } catch {
        // Table creation is best-effort telemetry
      }

      return this.session;
    } catch {
      return launch;
    }
  }

  async notifyRoundStart({ roundId, betAmount }) {
    if (!this.isActive()) return null;
    try {
      const targetRoundId = roundId || (await this.sdk.createRound({}));
      this.activeRoundId = targetRoundId;
      await this.sdk.startRound({ roundId: targetRoundId, betAmount });
      return targetRoundId;
    } catch {
      return null;
    }
  }

  async notifyRoundEnd({ roundId, payout, result }) {
    if (!this.isActive()) return;
    const targetRoundId = roundId || this.activeRoundId;
    if (!targetRoundId) return;
    try {
      await this.sdk.endRound({
        roundId: targetRoundId,
        result: result || (payout > 0 ? 'WIN' : 'LOSS'),
        payout: payout ?? 0,
      });
    } catch {
      // Best-effort telemetry
    } finally {
      if (this.activeRoundId === targetRoundId) {
        this.activeRoundId = null;
      }
    }
  }
}

export const providerSdkBridge = new ProviderSdkBridge();
