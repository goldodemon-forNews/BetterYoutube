/**
 * BetterYouTube — main application entry point.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize modules
  Player.init();
  Grid.init();
  // Pass null since we use YouTube embed — panel toggles still work
  Filters.init(null);
  AudioEngine.init(null);
  Capture.init(null);

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

  function markSignedIn() {
    signinLabel.textContent = "Signed In";
    signinBtn.classList.add("signed-in");
    signoutBtn.classList.remove("hidden");
    signinStatus.textContent = "Cookies saved. Your personalized feed will appear on the Home tab if YouTube accepts the cookies.";
    signinStatus.style.color = "#4caf50";
  }

  function markSignedOut() {
    signinLabel.textContent = "Sign In";
    signinBtn.classList.remove("signed-in");
    signoutBtn.classList.add("hidden");
    signinStatus.textContent = "";
  }

  // Check auth status on load
  API.authStatus().then(data => {
    if (data.signed_in) markSignedIn();
  }).catch(() => {});

  // Submit cookies
  document.getElementById("cookie-submit").addEventListener("click", async () => {
    const cookies = document.getElementById("cookie-input").value.trim();
    if (!cookies) {
      signinStatus.textContent = "Please paste your cookies first.";
      signinStatus.style.color = "#ff4444";
      return;
    }

    // Basic validation
    if (!cookies.includes("youtube.com") && !cookies.includes(".youtube.com")) {
      signinStatus.textContent = "These don't look like YouTube cookies. Make sure you export cookies from youtube.com.";
      signinStatus.style.color = "#ff8c00";
    }

    try {
      signinStatus.textContent = "Saving cookies...";
      signinStatus.style.color = "#aaa";
      await API.signIn(cookies);
      markSignedIn();
      // Reload home to try personalized feed
      Grid.loadHome();
      // Close modal after brief delay
      setTimeout(() => signinModal.classList.add("hidden"), 1500);
    } catch {
      signinStatus.textContent = "Failed to save cookies. Try again.";
      signinStatus.style.color = "#ff4444";
    }
  });

  // Sign out
  signoutBtn.addEventListener("click", async () => {
    await API.signOut();
    markSignedOut();
    signinStatus.textContent = "Signed out.";
    signinStatus.style.color = "#aaa";
    document.getElementById("cookie-input").value = "";
    Grid.loadHome();
  });
});
