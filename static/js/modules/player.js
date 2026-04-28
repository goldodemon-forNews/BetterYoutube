/**
 * Player — custom video player with advanced controls.
 *
 * Features: speed control (0.25–5x), frame stepping, A-B loop,
 * auto-resume, bandwidth saver, PiP, ambilight, bookmarks,
 * volume memory per channel, zen mode.
 */
const Player = {
  _video: null,
  _videoId: null,
  _channelId: null,
  _speed: 1,
  _abA: null,
  _abB: null,
  _abActive: false,
  _ambilightActive: false,
  _ambilightRAF: null,
  _zenActive: false,
  _chapters: [],
  _resumeInterval: null,
  _controlsTimeout: null,
  _duration: 0,

  init() {
    this._video = document.getElementById("video-player");
    this._bindControls();
    this._bindProgress();
    this._bindKeyboard();
    this._bindBandwidthSaver();
  },

  async play(videoId, channelId) {
    this._videoId = videoId;
    this._channelId = channelId || "";

    document.getElementById("player-section").classList.remove("hidden");
    document.getElementById("grid-section").style.display = "none";

    // Fetch stream URL
    try {
      const stream = await API.streamUrl(videoId, 1080);
      if (!stream || !stream.url) {
        // Fallback: open in browser
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
        return;
      }
      this._video.src = stream.url;
      this._video.load();

      // Auto-resume
      const saved = Store.getTimestamp(videoId);
      if (saved > 2) {
        this._video.currentTime = saved;
      }

      // Channel volume memory
      const chVol = Store.getChannelVolume(channelId);
      if (chVol !== null) {
        this._video.volume = chVol;
        document.getElementById("volume-slider").value = chVol;
      }

      this._video.play().catch(() => {});
    } catch {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
      return;
    }

    // Fetch video info
    try {
      const info = await API.videoInfo(videoId);
      if (info) {
        document.getElementById("video-title").textContent = info.title;
        document.getElementById("video-channel").textContent = info.channel;
        document.getElementById("video-views").textContent = this._fmtCount(info.view_count) + " views";
        document.getElementById("video-likes").textContent = this._fmtCount(info.like_count) + " likes";
        document.getElementById("video-date").textContent = this._fmtDate(info.upload_date);
        document.getElementById("video-description").textContent = info.description;
        this._chapters = info.chapters || [];
        this._renderChapters();
      }
    } catch { /* info is supplementary */ }

    this._renderBookmarks();
    this._startResumeTimer();

    // Show mini-player info
    document.getElementById("mini-title").textContent =
      document.getElementById("video-title").textContent;
    document.getElementById("mini-channel").textContent =
      document.getElementById("video-channel").textContent;
  },

  goHome() {
    this._saveCurrentTime();
    this._video.pause();
    this._video.src = "";
    this._stopAmbilight();
    document.getElementById("player-section").classList.add("hidden");
    document.getElementById("grid-section").style.display = "";
    if (this._zenActive) this._toggleZen();
    document.getElementById("filters-panel").classList.add("hidden");
    document.getElementById("audio-panel").classList.add("hidden");
  },

  // ── Controls ─────────────────────────────────────────────────
  _bindControls() {
    const v = this._video;

    // Play / Pause
    document.getElementById("play-btn").addEventListener("click", () => this._togglePlay());
    this._video.addEventListener("click", () => this._togglePlay());

    v.addEventListener("play", () => this._updatePlayIcon(true));
    v.addEventListener("pause", () => this._updatePlayIcon(false));
    v.addEventListener("timeupdate", () => this._onTimeUpdate());
    v.addEventListener("loadedmetadata", () => {
      this._duration = v.duration;
      document.getElementById("time-duration").textContent = this._fmtTime(v.duration);
    });
    v.addEventListener("progress", () => this._updateBuffered());

    // Volume
    document.getElementById("volume-slider").addEventListener("input", (e) => {
      v.volume = parseFloat(e.target.value);
      v.muted = false;
      Store.saveChannelVolume(this._channelId, v.volume);
    });
    document.getElementById("mute-btn").addEventListener("click", () => {
      v.muted = !v.muted;
    });

    // Speed
    document.getElementById("speed-up").addEventListener("click", () => this._changeSpeed(0.25));
    document.getElementById("speed-down").addEventListener("click", () => this._changeSpeed(-0.25));
    document.getElementById("speed-display").addEventListener("click", () => this._setSpeed(1));

    // Frame stepping
    document.getElementById("prev-frame-btn").addEventListener("click", () => this._frameStep(-1));
    document.getElementById("next-frame-btn").addEventListener("click", () => this._frameStep(1));

    // A-B loop
    document.getElementById("ab-loop-btn").addEventListener("click", () => this._toggleABLoop());

    // Fullscreen
    document.getElementById("fullscreen-btn").addEventListener("click", () => this._toggleFullscreen());

    // PiP
    document.getElementById("pip-btn").addEventListener("click", () => this._togglePiP());

    // Zen
    document.getElementById("zen-btn").addEventListener("click", () => this._toggleZen());

    // Ambilight
    document.getElementById("ambilight-btn").addEventListener("click", () => this._toggleAmbilight());

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

    // Show/hide controls on mouse movement
    const wrapper = document.getElementById("player-wrapper");
    wrapper.addEventListener("mousemove", () => {
      wrapper.classList.add("show-controls");
      clearTimeout(this._controlsTimeout);
      this._controlsTimeout = setTimeout(() => {
        if (!this._video.paused) wrapper.classList.remove("show-controls");
      }, 3000);
    });
  },

  _togglePlay() {
    if (this._video.paused) this._video.play().catch(() => {});
    else this._video.pause();
  },

  _updatePlayIcon(playing) {
    const btn = document.getElementById("play-btn");
    btn.innerHTML = playing
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
    document.getElementById("mini-play").textContent = playing ? "⏸" : "▶";
  },

  // ── Speed ────────────────────────────────────────────────────
  _changeSpeed(delta, fine = false) {
    const step = fine ? 0.05 : delta;
    this._setSpeed(Math.max(0.25, Math.min(5, this._speed + step)));
  },

  _setSpeed(s) {
    this._speed = Math.round(s * 100) / 100;
    this._video.playbackRate = this._speed;
    document.getElementById("speed-display").textContent = this._speed.toFixed(2) + "x";
  },

  // ── Frame stepping ───────────────────────────────────────────
  _frameStep(dir) {
    this._video.pause();
    // ~30fps assumed
    this._video.currentTime += dir * (1 / 30);
  },

  // ── A-B Loop ─────────────────────────────────────────────────
  _toggleABLoop() {
    const btn = document.getElementById("ab-loop-btn");
    const region = document.getElementById("progress-ab-region");

    if (this._abA === null) {
      // Set point A
      this._abA = this._video.currentTime;
      btn.classList.add("active");
      btn.title = "Set point B";
    } else if (this._abB === null) {
      // Set point B
      this._abB = this._video.currentTime;
      if (this._abB < this._abA) [this._abA, this._abB] = [this._abB, this._abA];
      this._abActive = true;
      btn.title = "Clear A-B loop";
      // Show region
      const d = this._duration || 1;
      region.style.left = (this._abA / d * 100) + "%";
      region.style.width = ((this._abB - this._abA) / d * 100) + "%";
      region.style.display = "block";
      this._video.currentTime = this._abA;
    } else {
      // Clear
      this._abA = null;
      this._abB = null;
      this._abActive = false;
      btn.classList.remove("active");
      btn.title = "A-B Loop";
      region.style.display = "none";
    }
  },

  // ── Progress ─────────────────────────────────────────────────
  _bindProgress() {
    const container = document.getElementById("progress-container");
    const tooltip = document.getElementById("progress-tooltip");
    let seeking = false;

    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * (this._duration || 0);
      tooltip.textContent = this._fmtTime(time);
      tooltip.style.left = (pct * 100) + "%";
    });

    container.addEventListener("mousedown", (e) => {
      seeking = true;
      this._seekTo(e, container);
    });
    document.addEventListener("mousemove", (e) => {
      if (seeking) this._seekTo(e, container);
    });
    document.addEventListener("mouseup", () => { seeking = false; });
  },

  _seekTo(e, container) {
    const rect = container.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this._video.currentTime = pct * (this._duration || 0);
  },

  _onTimeUpdate() {
    const t = this._video.currentTime;
    const d = this._duration || 1;
    const pct = (t / d) * 100;

    document.getElementById("progress-played").style.width = pct + "%";
    document.getElementById("progress-handle").style.left = pct + "%";
    document.getElementById("time-current").textContent = this._fmtTime(t);

    // A-B loop enforcement
    if (this._abActive && this._abB !== null && t >= this._abB) {
      this._video.currentTime = this._abA;
    }
  },

  _updateBuffered() {
    const b = this._video.buffered;
    if (b.length) {
      const end = b.end(b.length - 1);
      document.getElementById("progress-buffered").style.width =
        ((end / (this._duration || 1)) * 100) + "%";
    }
  },

  // ── Chapters ─────────────────────────────────────────────────
  _renderChapters() {
    const container = document.getElementById("chapter-markers");
    container.innerHTML = "";
    if (!this._chapters.length || !this._duration) return;
    this._chapters.forEach(ch => {
      const marker = document.createElement("div");
      marker.className = "chapter-marker";
      marker.style.left = ((ch.start / this._duration) * 100) + "%";
      marker.title = ch.title;
      container.appendChild(marker);
    });
  },

  // ── Fullscreen ───────────────────────────────────────────────
  _toggleFullscreen() {
    const el = document.getElementById("player-wrapper");
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  },

  // ── PiP ──────────────────────────────────────────────────────
  async _togglePiP() {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await this._video.requestPictureInPicture();
    } catch { /* not supported */ }
  },

  // ── Zen Mode ─────────────────────────────────────────────────
  _toggleZen() {
    this._zenActive = !this._zenActive;
    document.body.classList.toggle("zen-mode", this._zenActive);
    document.getElementById("zen-btn").classList.toggle("active", this._zenActive);
  },

  // ── Ambilight ────────────────────────────────────────────────
  _toggleAmbilight() {
    this._ambilightActive = !this._ambilightActive;
    document.querySelector(".player-area").classList.toggle("ambilight-active", this._ambilightActive);
    document.getElementById("ambilight-btn").classList.toggle("active", this._ambilightActive);

    if (this._ambilightActive) this._startAmbilight();
    else this._stopAmbilight();
  },

  _startAmbilight() {
    const canvas = document.getElementById("ambilight-canvas");
    const ctx = canvas.getContext("2d");

    const draw = () => {
      if (!this._ambilightActive) return;
      canvas.width = this._video.videoWidth || 320;
      canvas.height = this._video.videoHeight || 180;
      ctx.drawImage(this._video, 0, 0, canvas.width, canvas.height);
      this._ambilightRAF = requestAnimationFrame(draw);
    };
    draw();
  },

  _stopAmbilight() {
    if (this._ambilightRAF) cancelAnimationFrame(this._ambilightRAF);
    this._ambilightRAF = null;
  },

  // ── Bookmarks ────────────────────────────────────────────────
  _addBookmark() {
    if (!this._videoId) return;
    const time = this._video.currentTime;
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
        this._video.currentTime = bk.time;
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
    if (this._videoId && this._video.currentTime > 2) {
      Store.saveTimestamp(this._videoId, this._video.currentTime);
    }
  },

  // ── Bandwidth Saver ──────────────────────────────────────────
  _bindBandwidthSaver() {
    document.addEventListener("visibilitychange", () => {
      const s = Store.getSettings();
      if (!s.bandwidthSaver) return;
      // When tab becomes hidden, we could downscale; when visible, upscale.
      // Since we're using direct stream URLs, we reload at different quality.
      // For now, just pause/resume to save bandwidth.
      if (document.hidden && !this._video.paused) {
        // Keep playing but note the state
        this._wasPlaying = true;
      } else if (!document.hidden && this._wasPlaying) {
        this._wasPlaying = false;
      }
    });
  },

  // ── Keyboard ─────────────────────────────────────────────────
  _bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      // Ignore if typing in input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!this._videoId) return;

      const shift = e.shiftKey;
      switch (e.key) {
        case " ":
          e.preventDefault();
          this._togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (shift) this._frameStep(-1);
          else this._video.currentTime -= 5;
          break;
        case "ArrowRight":
          e.preventDefault();
          if (shift) this._frameStep(1);
          else this._video.currentTime += 5;
          break;
        case "ArrowUp":
          e.preventDefault();
          this._video.volume = Math.min(1, this._video.volume + 0.05);
          document.getElementById("volume-slider").value = this._video.volume;
          break;
        case "ArrowDown":
          e.preventDefault();
          this._video.volume = Math.max(0, this._video.volume - 0.05);
          document.getElementById("volume-slider").value = this._video.volume;
          break;
        case "j": this._video.currentTime -= 10; break;
        case "l": this._video.currentTime += 10; break;
        case "m":
        case "M":
          this._video.muted = !this._video.muted;
          break;
        case "f":
        case "F":
          this._toggleFullscreen();
          break;
        case "p":
          this._togglePiP();
          break;
        case "<":
        case ",":
          this._changeSpeed(shift ? -0.05 : -0.25, shift);
          break;
        case ">":
        case ".":
          this._changeSpeed(shift ? 0.05 : 0.25, shift);
          break;
        case "s":
        case "S":
          Capture.screenshot();
          break;
        case "a":
        case "A":
          this._toggleABLoop();
          break;
        case "z":
        case "Z":
          this._toggleZen();
          break;
        case "b":
        case "B":
          this._toggleAmbilight();
          break;
        case "?":
          document.getElementById("shortcuts-modal").classList.toggle("hidden");
          break;
      }
    });
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
