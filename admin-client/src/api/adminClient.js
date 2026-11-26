const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'td_admin_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const adminApi = {
  async login(username, password) {
    const data = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
    return request('/api/admin/logout', { method: 'POST' }).catch(() => ({ ok: true }));
  },

  me: () => request('/api/admin/me'),
  getStats: () => request('/api/admin/stats'),
  listProviders: () => request('/api/admin/providers'),
  createProvider: (payload) =>
    request('/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProvider: (id, payload) =>
    request(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteProvider: (id) =>
    request(`/api/admin/providers/${id}`, {
      method: 'DELETE',
    }),
  listRounds: (limit = 25) => request(`/api/admin/rounds?limit=${limit}`),
  listPlayers: (limit = 100, q = '') =>
    request(`/api/admin/players?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  getPlayerDetails: (id) => request(`/api/admin/players/${id}/details`),
  createPlayer: (payload) =>
    request('/api/admin/players', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adjustPlayerWallet: (id, payload) =>
    request(`/api/admin/players/${id}/wallet`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPlayerPassword: (id, password) =>
    request(`/api/admin/players/${id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  getConfigState: () => request('/api/admin/config'),
  saveConfigDraft: (payload) =>
    request('/api/admin/config/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  previewConfig: (payload, betPerBallCents, ballCount) => {
    const params = new URLSearchParams();
    if (betPerBallCents) params.set('betPerBallCents', String(betPerBallCents));
    if (ballCount) params.set('ballCount', String(ballCount));
    const qs = params.toString();
    return request(`/api/admin/config/preview${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  publishConfig: (baseVersion, publishReason, config) =>
    request('/api/admin/config/publish', {
      method: 'POST',
      body: JSON.stringify({ baseVersion, publishReason, config }),
    }),
  getConfigHistory: () => request('/api/admin/config/history'),
  compareConfigs: (v1, v2) => request(`/api/admin/config/compare?v1=${v1}&v2=${v2}`),
  getPayoutReport: () => request('/api/admin/payout-report'),
  getAuditLogs: (limit = 100) => request(`/api/admin/audit?limit=${limit}`),
};
