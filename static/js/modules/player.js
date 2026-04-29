/**
 * Player — YouTube embed-based player with custom UI controls.
 *
 * Uses YouTube IFrame Player API for reliable playback while keeping
 * the BetterYouTube UI: speed control, zen mode, bookmarks, etc.
 */
const Player = {
  _yt: null,           // YouTube IFrame Player instance
  _videoId: null,
  _channelId: null,
  _speed: 1,
  _zenActive: false,
  _duration: 0,
  _timeUpdateInterval: null,
  _resumeInterval: null,
  _controlsTimeout: null,

  init() {
    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    this._bindControls();
    this._bindKeyboard();
  },

  async play(videoId, channelId) {
    this._videoId = videoId;
    this._channelId = channelId || "";

    document.getElementById("player-section").classList.remove("hidden");
    document.getElementById("grid-section").style.display = "none";
    document.getElementById("shorts-section").classList.add("hidden");
    document.getElementById("channel-section").classList.add("hidden");

    // Show loading
    document.getElementById("player-loading").classList.remove("hidden");

    // Auto-resume: get saved time
    const savedTime = Store.getTimestamp(videoId);
    const startAt = savedTime > 2 ? Math.floor(savedTime) : 0;

    // Create or reuse the YouTube player
    const container = document.getElementById("yt-player-container");

    if (this._yt && typeof this._yt.loadVideoById === "function") {
      this._yt.loadVideoById({ videoId, startSeconds: startAt });
    } else {
      // Clear any previous player
      container.innerHTML = '<div id="yt-player"></div>';

      // Wait for API to be ready
      const waitForAPI = () => new Promise((resolve) => {
        if (window.YT && window.YT.Player) return resolve();
        window.onYouTubeIframeAPIReady = resolve;
      });
      await waitForAPI();

      this._yt = new YT.Player("yt-player", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          start: startAt,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => this._onPlayerReady(e),
          onStateChange: (e) => this._onStateChange(e),
        },
      });
    }

    // Fetch and display video info
    try {
      const info = await API.videoInfo(videoId);
      if (info) {
        document.getElementById("video-title").textContent = info.title;
        const chEl = document.getElementById("video-channel");
        chEl.textContent = info.channel;
        chEl.onclick = () => {
          if (info.channel_id) Grid.loadChannel(info.channel_id);
          else if (info.channel) Grid.loadChannel(info.channel);
        };
        document.getElementById("video-views").textContent =
          this._fmtCount(info.view_count) + " views";
        document.getElementById("video-likes").textContent =
          this._fmtCount(info.like_count) + " likes";
        document.getElementById("video-date").textContent =
          this._fmtDate(info.upload_date);
        document.getElementById("video-description").textContent =
          info.description;
      }
    } catch { /* info is supplementary */ }

    this._renderBookmarks();
    this._startResumeTimer();

    // Mini-player info
    document.getElementById("mini-title").textContent =
      document.getElementById("video-title").textContent;
    document.getElementById("mini-channel").textContent =
      document.getElementById("video-channel").textContent;
  },

  _onPlayerReady(event) {
    document.getElementById("player-loading").classList.add("hidden");

    // Restore volume from channel memory
    const chVol = Store.getChannelVolume(this._channelId);
    if (chVol !== null) {
      event.target.setVolume(chVol * 100);
      document.getElementById("volume-slider").value = chVol;
    }

    // Start tracking time for UI updates
    this._startTimeUpdates();
  },

  _onStateChange(event) {
    const state = event.data;

    if (state === YT.PlayerState.PLAYING) {
      document.getElementById("player-loading").classList.add("hidden");
      this._updatePlayIcon(true);
      this._duration = this._yt.getDuration();
      document.getElementById("time-duration").textContent =
        this._fmtTime(this._duration);
      this._startTimeUpdates();
    } else if (state === YT.PlayerState.PAUSED) {
      this._updatePlayIcon(false);
    } else if (state === YT.PlayerState.BUFFERING) {
      document.getElementById("player-loading").classList.remove("hidden");
    } else if (state === YT.PlayerState.ENDED) {
      this._updatePlayIcon(false);
    }
  },

  _startTimeUpdates() {
    clearInterval(this._timeUpdateInterval);
    this._timeUpdateInterval = setInterval(() => {
      if (!this._yt || typeof this._yt.getCurrentTime !== "function") return;
      const t = this._yt.getCurrentTime();
      const d = this._duration || this._yt.getDuration() || 1;
      const pct = (t / d) * 100;

      document.getElementById("progress-played").style.width = pct + "%";
      document.getElementById("progress-handle").style.left = pct + "%";
      document.getElementById("time-current").textContent = this._fmtTime(t);

      // Update buffered
      const buf = this._yt.getVideoLoadedFraction();
      document.getElementById("progress-buffered").style.width = (buf * 100) + "%";
    }, 250);
  },

  goHome() {
    this._saveCurrentTime();
    if (this._yt && typeof this._yt.pauseVideo === "function") {
      this._yt.pauseVideo();
    }
    clearInterval(this._timeUpdateInterval);

    document.getElementById("player-section").classList.add("hidden");
    document.getElementById("grid-section").style.display = "";
    document.getElementById("shorts-section").classList.add("hidden");
    document.getElementById("channel-section").classList.add("hidden");
    if (this._zenActive) this._toggleZen();
    document.getElementById("filters-panel").classList.add("hidden");
    document.getElementById("audio-panel").classList.add("hidden");
    document.getElementById("settings-panel").classList.add("hidden");
  },

  // ── Controls ─────────────────────────────────────────────────
  _bindControls() {
    // Play / Pause
    document.getElementById("play-btn").addEventListener("click", () => this._togglePlay());

    // Volume
    document.getElementById("volume-slider").addEventListener("input", (e) => {
      const vol = parseFloat(e.target.value);
      if (this._yt && typeof this._yt.setVolume === "function") {
        this._yt.setVolume(vol * 100);
        this._yt.unMute();
      }
      Store.saveChannelVolume(this._channelId, vol);
    });
    document.getElementById("mute-btn").addEventListener("click", () => {
      if (!this._yt) return;
      if (this._yt.isMuted()) this._yt.unMute();
      else this._yt.mute();
    });

    // Speed
    document.getElementById("speed-up").addEventListener("click", () => this._changeSpeed(0.25));
    document.getElementById("speed-down").addEventListener("click", () => this._changeSpeed(-0.25));
    document.getElementById("speed-display").addEventListener("click", () => this._setSpeed(1));

    // Fullscreen
    document.getElementById("fullscreen-btn").addEventListener("click", () => this._toggleFullscreen());

    // Zen
    document.getElementById("zen-btn").addEventListener("click", () => this._toggleZen());

    // Bookmarks
    document.getElementById("bookmark-btn").addEventListener("click", () => this._addBookmark());

    // Description toggle
    document.getElementById("desc-toggle").addEventListener("click", () => {
      const d = document.getElementById("video-description");
      d.classList.toggle("collapsed");
      document.getElementById("desc-toggle").textContent =
        d.classList.contains("collapsed") ? "Show more" : "Show less";
    });

    // Mini player
    document.getElementById("mini-close").addEventListener("click", () => {
      document.getElementById("mini-player").classList.add("hidden");
    });
    document.getElementById("mini-play").addEventListener("click", () => this._togglePlay());
  },

  _togglePlay() {
    if (!this._yt) return;
    const state = this._yt.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      this._yt.pauseVideo();
    } else {
      this._yt.playVideo();
    }
  },

  _updatePlayIcon(playing) {
    const btn = document.getElementById("play-btn");
    btn.innerHTML = playing
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
    document.getElementById("mini-play").textContent = playing ? "⏸" : "▶";
  },

  // ── Speed ────────────────────────────────────────────────────
  _changeSpeed(delta) {
    this._setSpeed(Math.max(0.25, Math.min(2, this._speed + delta)));
  },

  _setSpeed(s) {
    this._speed = Math.round(s * 100) / 100;
    if (this._yt && typeof this._yt.setPlaybackRate === "function") {
      this._yt.setPlaybackRate(this._speed);
    }
    document.getElementById("speed-display").textContent = this._speed.toFixed(2) + "x";
  },

  // ── Progress ─────────────────────────────────────────────────
  _bindProgress() {
    // Handled in init via _bindControls
  },

  _seekTo(pct) {
    if (!this._yt) return;
    const d = this._duration || this._yt.getDuration() || 0;
    this._yt.seekTo(pct * d, true);
  },

  // ── Fullscreen ───────────────────────────────────────────────
  _toggleFullscreen() {
    const el = document.getElementById("player-wrapper");
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  },

  // ── Zen Mode ─────────────────────────────────────────────────
  _toggleZen() {
    this._zenActive = !this._zenActive;
    document.body.classList.toggle("zen-mode", this._zenActive);
    document.getElementById("zen-btn").classList.toggle("active", this._zenActive);
  },

  // ── Bookmarks ────────────────────────────────────────────────
  _addBookmark() {
    if (!this._videoId || !this._yt) return;
    const time = this._yt.getCurrentTime();
    const label = this._fmtTime(time);
    Store.addBookmark(this._videoId, time, label);
    this._renderBookmarks();
  },

  _renderBookmarks() {
    const section = document.getElementById("bookmarks-section");
    const list = document.getElementById("bookmarks-list");
    if (!this._videoId) return;

    const bks = Store.getBookmarks(this._videoId);
    if (!bks.length) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    list.innerHTML = "";
    bks.forEach((bk, i) => {
      const item = document.createElement("div");
      item.className = "bookmark-item";
      item.innerHTML = `<span>${bk.label}</span><span class="bk-remove" data-i="${i}">&times;</span>`;
      item.querySelector("span").addEventListener("click", () => {
        if (this._yt) this._yt.seekTo(bk.time, true);
      });
      item.querySelector(".bk-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        Store.removeBookmark(this._videoId, i);
        this._renderBookmarks();
      });
      list.appendChild(item);
    });
  },

  // ── Auto-resume timer ────────────────────────────────────────
  _startResumeTimer() {
    clearInterval(this._resumeInterval);
    this._resumeInterval = setInterval(() => this._saveCurrentTime(), 5000);
  },

  _saveCurrentTime() {
    if (this._videoId && this._yt && typeof this._yt.getCurrentTime === "function") {
      const t = this._yt.getCurrentTime();
      if (t > 2) Store.saveTimestamp(this._videoId, t);
    }
  },

  // ── Keyboard ─────────────────────────────────────────────────
  _bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!this._videoId || !this._yt) return;

      const shift = e.shiftKey;
      switch (e.key) {
        case " ":
          e.preventDefault();
          this._togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          this._yt.seekTo(this._yt.getCurrentTime() - (shift ? 1 : 5), true);
          break;
        case "ArrowRight":
          e.preventDefault();
          this._yt.seekTo(this._yt.getCurrentTime() + (shift ? 1 : 5), true);
          break;
        case "ArrowUp":
          e.preventDefault();
          this._yt.setVolume(Math.min(100, this._yt.getVolume() + 5));
          document.getElementById("volume-slider").value = this._yt.getVolume() / 100;
          break;
        case "ArrowDown":
          e.preventDefault();
          this._yt.setVolume(Math.max(0, this._yt.getVolume() - 5));
          document.getElementById("volume-slider").value = this._yt.getVolume() / 100;
          break;
        case "j": this._yt.seekTo(this._yt.getCurrentTime() - 10, true); break;
        case "l": this._yt.seekTo(this._yt.getCurrentTime() + 10, true); break;
        case "m":
        case "M":
          if (this._yt.isMuted()) this._yt.unMute();
          else this._yt.mute();
          break;
        case "f":
        case "F":
          this._toggleFullscreen();
          break;
        case "<":
        case ",":
          this._changeSpeed(-0.25);
          break;
        case ">":
        case ".":
          this._changeSpeed(0.25);
          break;
        case "z":
        case "Z":
          this._toggleZen();
          break;
        case "?":
          document.getElementById("shortcuts-modal").classList.toggle("hidden");
          break;
      }
    });

    // Progress bar clicking
    const container = document.getElementById("progress-container");
    const tooltip = document.getElementById("progress-tooltip");

    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * (this._duration || 0);
      tooltip.textContent = this._fmtTime(time);
      tooltip.style.left = (pct * 100) + "%";
    });

    let seeking = false;
    const doSeek = (e) => {
      const rect = container.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this._seekTo(pct);
    };
    container.addEventListener("mousedown", (e) => { seeking = true; doSeek(e); });
    document.addEventListener("mousemove", (e) => { if (seeking) doSeek(e); });
    document.addEventListener("mouseup", () => { seeking = false; });
  },

  // ── Formatters ───────────────────────────────────────────────
  _fmtTime(s) {
    if (!s || isNaN(s)) return "0:00";
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  },

  _fmtCount(n) {
    if (!n) return "0";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  },

  _fmtDate(d) {
    if (!d || d.length < 8) return "";
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  },
};
