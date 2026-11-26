import { ProviderGameSDK } from '@gamotech/game-sdk-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ProviderSdkBridge {
  constructor() {
    this.sdk = null;
    this.session = null;
    this.initialized = false;
    this.tableCreated = false;
    this.activeRoundId = null;
  }

  hasSessionTokenInUrl() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('sessionToken'));
  }

  isActive() {
    return this.initialized && Boolean(this.sdk) && Boolean(this.session);
  }

  async initIfPresent() {
    if (this.initialized || !this.hasSessionTokenInUrl()) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/game/provider-config`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const cfg = await res.json();
      if (!cfg?.enabled || !cfg?.providerApiUrl) return null;

      this.sdk = new ProviderGameSDK({ apiBaseUrl: cfg.providerApiUrl });
      this.session = await this.sdk.initFromUrl();
      this.sdk.attachUnloadHandler();
      this.initialized = true;

      try {
        await this.sdk.createTable({
          gameCode: cfg.gameCode || 'temple-drop',
        });
        this.tableCreated = true;
      } catch {
        // Table creation is best-effort telemetry
      }

      return this.session;
    } catch {
      return null;
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
