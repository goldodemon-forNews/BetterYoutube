/**
 * BetterYouTube — main application entry point.
 */
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video-player");

  // Initialize all modules
  Player.init();
  Grid.init();
  Filters.init(video);
  AudioEngine.init(video);
  Capture.init(video);

  // Load trending on start
  Grid.loadTrending();

  // Logo → go home
  document.getElementById("logo").addEventListener("click", () => {
    Player.goHome();
    document.getElementById("search-input").value = "";
    Grid.loadTrending();
  });

  // Shortcuts modal
  document.getElementById("shortcuts-btn").addEventListener("click", () => {
    document.getElementById("shortcuts-modal").classList.toggle("hidden");
  });
});
