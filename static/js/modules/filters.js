/**
 * Filters — CSS video filter management + custom adjustments.
 */
const Filters = {
  _video: null,
  _current: "none",
  _brightness: 100,
  _contrast: 100,
  _saturation: 100,

  init(videoEl) {
    this._video = videoEl;
    const s = Store.getSettings();
    this._current = s.filter || "none";
    this._brightness = s.brightness ?? 100;
    this._contrast = s.contrast ?? 100;
    this._saturation = s.saturation ?? 100;

    // Bind filter radios
    document.querySelectorAll('input[name="vfilter"]').forEach(r => {
      if (r.value === this._current) r.checked = true;
      r.addEventListener("change", () => this.setPreset(r.value));
    });

    // Custom sliders
    this._bindSlider("brightness");
    this._bindSlider("contrast");
    this._bindSlider("saturation");

    document.getElementById("filter-reset").addEventListener("click", () => this.reset());
    document.getElementById("filters-btn").addEventListener("click", () => this._togglePanel());

    this._apply();
  },

  setPreset(name) {
    this._current = name;
    if (name !== "none") {
      this._brightness = 100;
      this._contrast = 100;
      this._saturation = 100;
      document.getElementById("brightness-slider").value = 100;
      document.getElementById("contrast-slider").value = 100;
      document.getElementById("saturation-slider").value = 100;
      this._updateSliderLabels();
    }
    this._apply();
    this._save();
  },

  reset() {
    this._current = "none";
    this._brightness = 100;
    this._contrast = 100;
    this._saturation = 100;
    document.querySelector('input[name="vfilter"][value="none"]').checked = true;
    document.getElementById("brightness-slider").value = 100;
    document.getElementById("contrast-slider").value = 100;
    document.getElementById("saturation-slider").value = 100;
    this._updateSliderLabels();
    this._apply();
    this._save();
  },

  _apply() {
    // Remove old filter classes
    this._video.className = this._video.className
      .replace(/\bfilter-\S+/g, "").trim();

    if (this._current !== "none") {
      this._video.classList.add(`filter-${this._current}`);
    }

    // Custom adjustments (stacked via inline style)
    const parts = [];
    if (this._brightness !== 100) parts.push(`brightness(${this._brightness / 100})`);
    if (this._contrast !== 100) parts.push(`contrast(${this._contrast / 100})`);
    if (this._saturation !== 100) parts.push(`saturate(${this._saturation / 100})`);

    if (this._current === "none" && parts.length) {
      this._video.style.filter = parts.join(" ");
    } else if (this._current === "none") {
      this._video.style.filter = "";
    }
    // When a preset is active, CSS class handles the filter; custom sliders are ignored.
  },

  _bindSlider(name) {
    const slider = document.getElementById(`${name}-slider`);
    slider.value = this[`_${name}`];
    slider.addEventListener("input", () => {
      this[`_${name}`] = parseInt(slider.value, 10);
      document.getElementById(`${name}-val`).textContent = slider.value + "%";
      if (this._current !== "none") {
        this._current = "none";
        document.querySelector('input[name="vfilter"][value="none"]').checked = true;
      }
      this._apply();
      this._save();
    });
  },

  _updateSliderLabels() {
    document.getElementById("brightness-val").textContent = this._brightness + "%";
    document.getElementById("contrast-val").textContent = this._contrast + "%";
    document.getElementById("saturation-val").textContent = this._saturation + "%";
  },

  _togglePanel() {
    document.getElementById("filters-panel").classList.toggle("hidden");
    document.getElementById("audio-panel").classList.add("hidden");
    document.getElementById("settings-panel").classList.add("hidden");
  },

  _save() {
    const s = Store.getSettings();
    s.filter = this._current;
    s.brightness = this._brightness;
    s.contrast = this._contrast;
    s.saturation = this._saturation;
    Store.saveSettings(s);
  },
};
