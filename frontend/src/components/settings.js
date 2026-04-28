/**
 * Settings panel component.
 */
const Settings = {
  panel: null,

  init() {
    this.panel = document.getElementById("settings-panel");

    document.getElementById("settings-btn").addEventListener("click", () => {
      this.open();
    });

    document.getElementById("settings-close").addEventListener("click", () => {
      this.close();
    });

    document
      .querySelector(".settings-overlay")
      .addEventListener("click", () => {
        this.close();
      });

    this._bindControls();
    this._loadSettings();
  },

  open() {
    this.panel.classList.remove("hidden");
  },

  close() {
    this.panel.classList.add("hidden");
  },

  _bindControls() {
    document
      .getElementById("ad-shield-toggle")
      .addEventListener("change", (e) => {
        this._save({ ad_shield_enabled: e.target.checked });
      });

    document
      .getElementById("interpolation-toggle")
      .addEventListener("change", (e) => {
        this._save({ interpolation_enabled: e.target.checked });
      });

    document
      .getElementById("resolution-select")
      .addEventListener("change", (e) => {
        this._save({ default_resolution: e.target.value });
      });
  },

  async _loadSettings() {
    try {
      const settings = await API.getSettings();
      document.getElementById("ad-shield-toggle").checked =
        settings.ad_shield_enabled;
      document.getElementById("interpolation-toggle").checked =
        settings.interpolation_enabled;
      document.getElementById("resolution-select").value =
        settings.default_resolution;
    } catch {
      // Use HTML defaults if settings can't be loaded.
    }
  },

  async _save(update) {
    try {
      await API.updateSettings(update);
    } catch {
      // Silently fail; settings will reset on next load.
    }
  },
};
