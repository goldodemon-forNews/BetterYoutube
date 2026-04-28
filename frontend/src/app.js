/**
 * BetterYouTube — main application entry point.
 */
document.addEventListener("DOMContentLoaded", () => {
  Player.init();
  Search.init();
  Settings.init();

  // Load trending videos on startup.
  Search.loadTrending();

  // Clicking the logo resets to the home / trending view.
  document.querySelector(".logo").addEventListener("click", () => {
    Player.hide();
    Search.input.value = "";
    Search.loadTrending();
  });
});
