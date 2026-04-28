/**
 * API — backend communication.
 */
const API = {
  async _get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },

  search(q, max = 20) {
    return this._get(`/api/search?q=${encodeURIComponent(q)}&max=${max}`);
  },

  trending() {
    return this._get("/api/trending");
  },

  videoInfo(id) {
    return this._get(`/api/video/${id}`);
  },

  streamUrl(id, height = 1080) {
    return this._get(`/api/stream/${id}?h=${height}`);
  },
};
