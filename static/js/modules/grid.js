/**
 * Grid — video grid rendering and search.
 */
const Grid = {
  _grid: null,
  _status: null,

  init() {
    this._grid = document.getElementById("video-grid");
    this._status = document.getElementById("status-msg");

    document.getElementById("search-btn").addEventListener("click", () => this.search());
    document.getElementById("search-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.search();
    });
  },

  async search() {
    const q = document.getElementById("search-input").value.trim();
    if (!q) return;
    this._showStatus(`Searching "${q}"...`);
    this._grid.innerHTML = "";
    try {
      const data = await API.search(q);
      this.render(data.items || []);
    } catch {
      this._showStatus("Search failed. Please try again.");
    }
  },

  async loadTrending() {
    this._showStatus("Loading trending videos...");
    try {
      const data = await API.trending();
      this.render(data.items || []);
    } catch {
      this._showStatus("Failed to load trending videos.");
    }
  },

  render(items) {
    this._grid.innerHTML = "";
    if (!items.length) {
      this._showStatus("No videos found.");
      return;
    }
    this._status.style.display = "none";

    items.forEach(v => {
      const card = document.createElement("div");
      card.className = "v-card";
      const dur = v.duration ? this._fmtDuration(v.duration) : "";
      const views = v.view_count ? this._fmtCount(v.view_count) + " views" : "";
      card.innerHTML = `
        <div class="thumb-wrap">
          <img class="thumb" src="${v.thumbnail}" alt="${this._esc(v.title)}" loading="lazy" />
          ${dur ? `<span class="dur">${dur}</span>` : ""}
        </div>
        <div class="info">
          <div class="title">${this._esc(v.title)}</div>
          <div class="meta">${this._esc(v.channel)}${views ? " · " + views : ""}</div>
        </div>
      `;
      card.addEventListener("click", () => {
        Player.play(v.id, v.channel_id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      this._grid.appendChild(card);
    });
  },

  _showStatus(text) {
    this._status.textContent = text;
    this._status.style.display = "";
  },

  _fmtDuration(s) {
    if (!s) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  },

  _fmtCount(n) {
    if (!n) return "";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  },

  _esc(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  },
};
