/**
 * AudioEngine — Web Audio API: normalization, EQ, bass boost.
 */
const AudioEngine = {
  _ctx: null,
  _source: null,
  _compressor: null,
  _bassFilter: null,
  _eqBands: [],
  _connected: false,
  _video: null,

  EQ_FREQUENCIES: [60, 170, 350, 1000, 3500, 10000],
  PRESETS: {
    flat:       [0, 0, 0, 0, 0, 0],
    podcast:    [-2, 0, 2, 5, 4, 1],
    music:      [3, 1, 0, 2, 3, 4],
    "bass-heavy": [8, 5, 2, 0, -1, -2],
    treble:     [-2, -1, 0, 2, 5, 7],
  },

  init(videoEl) {
    this._video = videoEl;
    this._buildEQSliders();

    const s = Store.getSettings();

    document.getElementById("normalize-toggle").checked = s.normalize || false;
    document.getElementById("bass-toggle").checked = s.bassBoost || false;

    document.getElementById("normalize-toggle").addEventListener("change", (e) => {
      this._ensureContext();
      this._setNormalize(e.target.checked);
      this._saveSettings();
    });

    document.getElementById("bass-toggle").addEventListener("change", (e) => {
      this._ensureContext();
      this._setBassBoost(e.target.checked);
      this._saveSettings();
    });

    document.querySelectorAll(".eq-btn").forEach(btn => {
      if (btn.dataset.preset === (s.eqPreset || "flat")) btn.classList.add("active");
      btn.addEventListener("click", () => {
        document.querySelectorAll(".eq-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this._ensureContext();
        this._applyPreset(btn.dataset.preset);
        this._saveSettings();
      });
    });

    document.getElementById("audio-btn").addEventListener("click", () => this._togglePanel());
  },

  _ensureContext() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._source = this._ctx.createMediaElementSource(this._video);

    // Compressor for normalization
    this._compressor = this._ctx.createDynamicsCompressor();
    this._compressor.threshold.value = -24;
    this._compressor.knee.value = 30;
    this._compressor.ratio.value = 12;
    this._compressor.attack.value = 0.003;
    this._compressor.release.value = 0.25;

    // Bass filter
    this._bassFilter = this._ctx.createBiquadFilter();
    this._bassFilter.type = "lowshelf";
    this._bassFilter.frequency.value = 200;
    this._bassFilter.gain.value = 0;

    // EQ bands
    this._eqBands = this.EQ_FREQUENCIES.map(freq => {
      const f = this._ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.4;
      f.gain.value = 0;
      return f;
    });

    // Chain: source → EQ bands → bass → compressor → destination
    let chain = this._source;
    for (const band of this._eqBands) {
      chain.connect(band);
      chain = band;
    }
    chain.connect(this._bassFilter);
    this._bassFilter.connect(this._compressor);
    this._compressor.connect(this._ctx.destination);

    // Also direct path (bypass) — we control via compressor ratio
    this._connected = true;

    // Apply saved settings
    const s = Store.getSettings();
    this._setNormalize(s.normalize || false);
    this._setBassBoost(s.bassBoost || false);
    this._applyPreset(s.eqPreset || "flat");
  },

  _setNormalize(on) {
    if (!this._compressor) return;
    this._compressor.ratio.value = on ? 12 : 1;
  },

  _setBassBoost(on) {
    if (!this._bassFilter) return;
    this._bassFilter.gain.value = on ? 10 : 0;
  },

  _applyPreset(name) {
    const gains = this.PRESETS[name] || this.PRESETS.flat;
    this._eqBands.forEach((band, i) => {
      band.gain.value = gains[i] || 0;
    });
    // Update sliders
    const sliders = document.querySelectorAll(".eq-band input");
    sliders.forEach((s, i) => { s.value = gains[i] || 0; });
  },

  _buildEQSliders() {
    const container = document.getElementById("eq-sliders");
    this.EQ_FREQUENCIES.forEach((freq, i) => {
      const div = document.createElement("div");
      div.className = "eq-band";
      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      div.innerHTML = `
        <input type="range" min="-12" max="12" value="0" data-band="${i}" />
        <span>${label}</span>
      `;
      div.querySelector("input").addEventListener("input", (e) => {
        this._ensureContext();
        this._eqBands[i].gain.value = parseFloat(e.target.value);
        // Deselect preset
        document.querySelectorAll(".eq-btn").forEach(b => b.classList.remove("active"));
        this._saveSettings();
      });
      container.appendChild(div);
    });
  },

  _togglePanel() {
    document.getElementById("audio-panel").classList.toggle("hidden");
    document.getElementById("filters-panel").classList.add("hidden");
  },

  _saveSettings() {
    const s = Store.getSettings();
    s.normalize = document.getElementById("normalize-toggle").checked;
    s.bassBoost = document.getElementById("bass-toggle").checked;
    const activePreset = document.querySelector(".eq-btn.active");
    s.eqPreset = activePreset ? activePreset.dataset.preset : "custom";
    Store.saveSettings(s);
  },
};
