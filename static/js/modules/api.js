/**
 * API — backend communication.
 */
const API = {
  async _get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },

  async _post(url, data) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },

  search(q, max = 20) {
    return this._get(`/api/search?q=${encodeURIComponent(q)}&max=${max}`);
  },

  trending() {
    return this._get("/api/trending");
  },

  feed() {
    return this._get("/api/feed");
  },

  shorts() {
    return this._get("/api/shorts");
  },

  channelInfo(channelId) {
    return this._get(`/api/channel/${encodeURIComponent(channelId)}`);
  },

  videoInfo(id) {
    return this._get(`/api/video/${id}`);
  },

  streamUrl(id, height = 1080) {
    return this._get(`/api/stream/${id}?h=${height}`);
  },

  proxyUrl(id, height = 720) {
    return `/api/proxy/${id}?h=${height}`;
  },

  authStatus() {
    return this._get("/api/auth/status");
  },

  signIn(cookies) {
    return this._post("/api/auth/signin", { cookies });
  },

  signOut() {
    return this._post("/api/auth/signout", {});
  },
};
