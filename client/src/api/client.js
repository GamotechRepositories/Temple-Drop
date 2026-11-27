import { providerSdkBridge } from './providerSdk.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

class ApiClient {
  constructor() {
    this.csrfToken = null;
  }

  buildUrl(endpoint) {
    return `${API_BASE_URL}${endpoint}`;
  }

  generateIdempotencyKey() {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  async fetchCsrfToken() {
    try {
      const res = await fetch(this.buildUrl('/api/csrf-token'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.csrfToken = data.csrfToken;
        return data.csrfToken;
      }
    } catch {}
    return '';
  }

  async request(endpoint, options = {}, requiresIdempotency = false) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...providerSdkBridge.getLaunchHeaders(),
      ...(options.headers || {}),
    };

    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
      if (!this.csrfToken) {
        await this.fetchCsrfToken();
      }
      if (this.csrfToken) {
        headers['x-csrf-token'] = this.csrfToken;
      }
    }

    if (requiresIdempotency) {
      headers['x-idempotency-key'] = this.generateIdempotencyKey();
    }

    const response = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async guestLogin() {
    const res = await this.request('/api/auth/guest', {
      method: 'POST',
    });
    await this.fetchCsrfToken();
    return res;
  }

  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.fetchCsrfToken();
    return res;
  }

  async register(email, password) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.fetchCsrfToken();
    return res;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.csrfToken = null;
  }

  async updatePreferences(preferences) {
    return this.request('/api/profile/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async getGameConfig() {
    return this.request('/api/game/config');
  }

  async getGameState() {
    return this.request('/api/game/state');
  }

  async postDrop(betPerBallCents, ballCount) {
    return this.request(
      '/api/game/drop',
      {
        method: 'POST',
        body: JSON.stringify({ betPerBallCents, ballCount }),
      },
      true
    );
  }

  async postSpin() {
    return this.request(
      '/api/game/spin',
      {
        method: 'POST',
      },
      true
    );
  }

  async postBonusDrop() {
    return this.request(
      '/api/game/bonus/drop',
      {
        method: 'POST',
      },
      true
    );
  }

  async refillWallet() {
    return this.request('/api/game/wallet/refill', {
      method: 'POST',
    });
  }

  async getHistory(page = 1, limit = 10) {
    return this.request(`/api/game/history?page=${page}&limit=${limit}`);
  }

  async getRoundDetails(roundId) {
    return this.request(`/api/game/history/${roundId}`);
  }
}

export const api = new ApiClient();
