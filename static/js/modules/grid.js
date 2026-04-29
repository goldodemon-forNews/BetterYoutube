/**
 * Grid — video grid, shorts grid, channel page, search.
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

    this._showSection("grid");
    this._showStatus(`Searching "${q}"...`);
    this._grid.innerHTML = "";

    try {
      // Run video search and channel lookup in parallel
      const [data, channelInfo] = await Promise.allSettled([
        API.search(q),
        API.channelInfo(q),
      ]);

      const items = data.status === "fulfilled" ? (data.value.items || []) : [];
      const channel = channelInfo.status === "fulfilled" ? channelInfo.value : null;

      // Show channel card at top if found
      if (channel && channel.name && channel.videos && channel.videos.length > 0) {
        const channelCard = this._createChannelCard(channel);
        this._grid.appendChild(channelCard);
      }

      // Then show video results
      if (!items.length && (!channel || !channel.videos || !channel.videos.length)) {
        this._showStatus("No results found.");
        return;
      }
      this._status.style.display = "none";
      items.forEach(v => {
        this._grid.appendChild(this._createCard(v));
      });
    } catch {
      this._showStatus("Search failed. Please try again.");
    }
  },

  async loadHome() {
    this._showSection("grid");

    // Always load trending first so the page isn't blank
    this._showStatus("Loading trending videos...");
    try {
      const data = await API.trending();
      const items = data.items || [];
      if (items.length) {
        this.render(items);
      } else {
        this._showStatus("No videos found.");
      }
    } catch {
      this._showStatus("Failed to load videos.");
    }

    // Then try personalized feed in background (replaces if successful)
    try {
      const feed = await API.feed();
      if (feed.signed_in && feed.items && feed.items.length) {
        this.render(feed.items);
      }
    } catch { /* ignore — trending is already showing */ }
  },

  async loadTrending() {
    this._showSection("grid");
    this._showStatus("Loading trending videos...");
    try {
      const data = await API.trending();
      this.render(data.items || []);
    } catch {
      this._showStatus("Failed to load trending videos.");
    }
  },

  async loadShorts() {
    this._showSection("shorts");
    const status = document.getElementById("shorts-status");
    const grid = document.getElementById("shorts-grid");
    status.textContent = "Loading Shorts...";
    grid.innerHTML = "";

    try {
      const data = await API.shorts();
      const items = data.items || [];
      if (!items.length) {
        status.textContent = "No shorts found.";
        return;
      }
      status.textContent = "";
      items.forEach(v => {
        const card = document.createElement("div");
        card.className = "short-card";
        const thumb = v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
        card.innerHTML = `
          <img src="${thumb}" alt="${this._esc(v.title)}" loading="lazy" />
          <div class="short-overlay">
            <div class="short-title">${this._esc(v.title)}</div>
            <div class="short-views">${v.view_count ? this._fmtCount(v.view_count) + " views" : ""}</div>
          </div>
        `;
        card.addEventListener("click", () => {
          Player.play(v.id, v.channel_id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        grid.appendChild(card);
      });
    } catch {
      status.textContent = "Failed to load Shorts.";
    }
  },

  async loadChannel(channelId) {
    this._showSection("channel");
    document.getElementById("channel-name").textContent = "Loading...";
    document.getElementById("channel-subs").textContent = "";
    document.getElementById("channel-desc").textContent = "";
    document.getElementById("channel-videos").innerHTML = "";
    document.getElementById("channel-avatar").style.display = "none";

    try {
      const info = await API.channelInfo(channelId);
      if (!info || info.error) {
        document.getElementById("channel-name").textContent = "Channel not found";
        return;
      }
      document.getElementById("channel-name").textContent = info.name || channelId;
      document.getElementById("channel-subs").textContent =
        info.subscriber_count ? this._fmtCount(info.subscriber_count) + " subscribers" : "";
      document.getElementById("channel-desc").textContent = info.description || "";
      const avatar = document.getElementById("channel-avatar");
      if (info.thumbnail) {
        avatar.src = info.thumbnail;
        avatar.style.display = "";
      }

      const vGrid = document.getElementById("channel-videos");
      (info.videos || []).forEach(v => {
        vGrid.appendChild(this._createCard(v));
      });

      if (!info.videos || !info.videos.length) {
        const msg = document.createElement("p");
        msg.className = "status-msg";
        msg.textContent = "No videos found for this channel.";
        vGrid.appendChild(msg);
      }
    } catch {
      document.getElementById("channel-name").textContent = "Failed to load channel";
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
      this._grid.appendChild(this._createCard(v));
    });
  },

  _createChannelCard(channel) {
    const card = document.createElement("div");
    card.className = "channel-result-card";
    const avatar = channel.thumbnail
      ? `<img src="${channel.thumbnail}" class="channel-result-avatar" />`
      : `<div class="channel-result-avatar placeholder"></div>`;
    const subs = channel.subscriber_count
      ? this._fmtCount(channel.subscriber_count) + " subscribers"
      : "";
    const vidCount = channel.videos ? channel.videos.length + " videos" : "";
    card.innerHTML = `
      ${avatar}
      <div class="channel-result-info">
        <h3 class="channel-result-name">${this._esc(channel.name)}</h3>
        <span class="channel-result-subs">${subs}${subs && vidCount ? " · " : ""}${vidCount}</span>
        <p class="channel-result-desc">${this._esc((channel.description || "").substring(0, 120))}</p>
      </div>
      <button class="btn-view-channel">View Channel</button>
    `;
    card.querySelector(".btn-view-channel").addEventListener("click", () => {
      this.loadChannel(channel.id || channel.name);
    });
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".btn-view-channel")) {
        this.loadChannel(channel.id || channel.name);
      }
    });
    return card;
  },

  _createCard(v) {
    const card = document.createElement("div");
    card.className = "v-card";
    const dur = v.duration ? this._fmtDuration(v.duration) : "";
    const views = v.view_count ? this._fmtCount(v.view_count) + " views" : "";
    const thumb = v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
    card.innerHTML = `
      <div class="thumb-wrap">
        <img class="thumb" src="${thumb}" alt="${this._esc(v.title)}" loading="lazy"
          onerror="this.src='https://i.ytimg.com/vi/${v.id}/hqdefault.jpg'" />
        ${dur ? `<span class="dur">${dur}</span>` : ""}
      </div>
      <div class="info">
        <div class="title">${this._esc(v.title)}</div>
        <div class="meta">
          <span class="channel-name" data-channel="${this._esc(v.channel_id || v.channel)}">${this._esc(v.channel)}</span>
          ${views ? `<span class="dot">·</span><span>${views}</span>` : ""}
        </div>
      </div>
    `;

    // Click card → play video
    card.addEventListener("click", (e) => {
      if (e.target.closest(".channel-name")) return;
      Player.play(v.id, v.channel_id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Click channel name → open channel page
    const chEl = card.querySelector(".channel-name");
    if (chEl) {
      chEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const chId = chEl.dataset.channel;
        if (chId) Grid.loadChannel(chId);
      });
    }

    return card;
  },

  _showSection(name) {
    document.getElementById("grid-section").style.display = name === "grid" ? "" : "none";
    document.getElementById("shorts-section").classList.toggle("hidden", name !== "shorts");
    document.getElementById("channel-section").classList.toggle("hidden", name !== "channel");
    document.getElementById("player-section").classList.add("hidden");
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
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
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
