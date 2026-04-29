/**
 * BetterYouTube — main application entry point.
 */
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video-player");

  // Initialize modules
  Player.init();
  Grid.init();
  Filters.init(video);
  AudioEngine.init(video);
  Capture.init(video);

  // ── Load home feed ──────────────────────────────────────────
  Grid.loadHome();

  // ── Logo → go home ──────────────────────────────────────────
  document.getElementById("logo").addEventListener("click", () => {
    Player.goHome();
    document.getElementById("search-input").value = "";
    setActiveTab("home");
    Grid.loadHome();
  });

  // ── Nav tabs ────────────────────────────────────────────────
  function setActiveTab(name) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      setActiveTab(name);
      Player.goHome();
      if (name === "home") Grid.loadHome();
      else if (name === "trending") Grid.loadTrending();
      else if (name === "shorts") Grid.loadShorts();
    });
  });

  // Shorts nav button in header
  document.getElementById("shorts-nav-btn").addEventListener("click", () => {
    Player.goHome();
    setActiveTab("shorts");
    Grid.loadShorts();
  });

  // ── Modals ──────────────────────────────────────────────────
  // Close modals via × button and overlay click
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".modal").classList.add("hidden"));
  });
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", () => ov.closest(".modal").classList.add("hidden"));
  });

  // Shortcuts modal
  document.getElementById("shortcuts-btn").addEventListener("click", () => {
    document.getElementById("shortcuts-modal").classList.toggle("hidden");
  });

  // ── Side panel close buttons ────────────────────────────────
  document.querySelectorAll(".panel-close").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".side-panel").classList.add("hidden"));
  });

  // ── Settings panel ──────────────────────────────────────────
  document.getElementById("settings-btn").addEventListener("click", () => {
    document.getElementById("settings-panel").classList.toggle("hidden");
    document.getElementById("filters-panel").classList.add("hidden");
    document.getElementById("audio-panel").classList.add("hidden");
  });

  // Settings toggles
  const settings = Store.getSettings();
  document.getElementById("bandwidth-toggle").checked = settings.bandwidthSaver !== false;
  document.getElementById("autoresume-toggle").checked = settings.autoResume !== false;
  document.getElementById("chvol-toggle").checked = settings.channelVolume !== false;
  if (settings.defaultQuality) {
    document.getElementById("default-quality").value = settings.defaultQuality;
  }

  ["bandwidth-toggle", "autoresume-toggle", "chvol-toggle"].forEach(id => {
    document.getElementById(id).addEventListener("change", saveAppSettings);
  });
  document.getElementById("default-quality").addEventListener("change", saveAppSettings);

  function saveAppSettings() {
    const s = Store.getSettings();
    s.bandwidthSaver = document.getElementById("bandwidth-toggle").checked;
    s.autoResume = document.getElementById("autoresume-toggle").checked;
    s.channelVolume = document.getElementById("chvol-toggle").checked;
    s.defaultQuality = parseInt(document.getElementById("default-quality").value, 10);
    Store.saveSettings(s);
  }

  // ── Sign In ─────────────────────────────────────────────────
  const signinBtn = document.getElementById("signin-btn");
  const signinModal = document.getElementById("signin-modal");
  const signinLabel = document.getElementById("signin-label");
  const signoutBtn = document.getElementById("signout-btn");
  const signinStatus = document.getElementById("signin-status");

  signinBtn.addEventListener("click", () => {
    signinModal.classList.toggle("hidden");
  });

  // Check auth status on load
  API.authStatus().then(data => {
    if (data.signed_in) {
      signinLabel.textContent = "Signed In";
      signinBtn.classList.add("signed-in");
      signoutBtn.classList.remove("hidden");
      signinStatus.textContent = "You are signed in. Your personalized feed is active.";
      signinStatus.style.color = "#4caf50";
    }
  }).catch(() => {});

  // Submit cookies
  document.getElementById("cookie-submit").addEventListener("click", async () => {
    const cookies = document.getElementById("cookie-input").value.trim();
    if (!cookies) {
      signinStatus.textContent = "Please paste your cookies first.";
      signinStatus.style.color = "#ff4444";
      return;
    }
    try {
      signinStatus.textContent = "Signing in...";
      await API.signIn(cookies);
      signinStatus.textContent = "Signed in successfully! Reload to see your feed.";
      signinStatus.style.color = "#4caf50";
      signinLabel.textContent = "Signed In";
      signinBtn.classList.add("signed-in");
      signoutBtn.classList.remove("hidden");
      Grid.loadHome();
    } catch {
      signinStatus.textContent = "Sign in failed. Check your cookies.";
      signinStatus.style.color = "#ff4444";
    }
  });

  // Sign out
  signoutBtn.addEventListener("click", async () => {
    await API.signOut();
    signinLabel.textContent = "Sign In";
    signinBtn.classList.remove("signed-in");
    signoutBtn.classList.add("hidden");
    signinStatus.textContent = "Signed out.";
    signinStatus.style.color = "#aaa";
    document.getElementById("cookie-input").value = "";
    Grid.loadHome();
  });
});
