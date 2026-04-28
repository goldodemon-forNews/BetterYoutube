/**
 * Store — localStorage wrapper for persistent state.
 */
const Store = {
  _prefix: "byt_",

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._prefix + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    try { localStorage.setItem(this._prefix + key, JSON.stringify(value)); }
    catch { /* quota exceeded — ignore */ }
  },

  remove(key) {
    localStorage.removeItem(this._prefix + key);
  },

  // ── Auto-resume ──────────────────────────────────────────────
  saveTimestamp(videoId, time) {
    const map = this.get("resume", {});
    map[videoId] = time;
    // keep last 200 entries
    const keys = Object.keys(map);
    if (keys.length > 200) delete map[keys[0]];
    this.set("resume", map);
  },

  getTimestamp(videoId) {
    return (this.get("resume", {}))[videoId] || 0;
  },

  // ── Volume memory per channel ────────────────────────────────
  saveChannelVolume(channelId, vol) {
    if (!channelId) return;
    const map = this.get("ch_vol", {});
    map[channelId] = vol;
    this.set("ch_vol", map);
  },

  getChannelVolume(channelId) {
    if (!channelId) return null;
    const map = this.get("ch_vol", {});
    return map[channelId] ?? null;
  },

  // ── Bookmarks ────────────────────────────────────────────────
  getBookmarks(videoId) {
    return (this.get("bookmarks", {}))[videoId] || [];
  },

  addBookmark(videoId, time, label) {
    const all = this.get("bookmarks", {});
    if (!all[videoId]) all[videoId] = [];
    all[videoId].push({ time, label });
    all[videoId].sort((a, b) => a.time - b.time);
    this.set("bookmarks", all);
  },

  removeBookmark(videoId, index) {
    const all = this.get("bookmarks", {});
    if (all[videoId]) {
      all[videoId].splice(index, 1);
      this.set("bookmarks", all);
    }
  },

  // ── Settings ─────────────────────────────────────────────────
  getSettings() {
    return this.get("settings", {
      filter: "none",
      brightness: 100,
      contrast: 100,
      saturation: 100,
      normalize: false,
      bassBoost: false,
      eqPreset: "flat",
      bandwidthSaver: true,
    });
  },

  saveSettings(s) {
    this.set("settings", s);
  },
};
