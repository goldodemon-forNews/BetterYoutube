/**
 * Search component — handles search input and results display.
 */
const Search = {
  input: null,
  grid: null,
  loading: null,

  init() {
    this.input = document.getElementById("search-input");
    this.grid = document.getElementById("video-grid");
    this.loading = document.getElementById("loading");

    document.getElementById("search-btn").addEventListener("click", () => {
      this.performSearch();
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.performSearch();
    });
  },

  async performSearch() {
    const query = this.input.value.trim();
    if (!query) return;

    Player.hide();
    this.showLoading(true);
    this.grid.innerHTML = "";

    try {
      const results = await API.searchVideos(query);
      this.renderResults(results.items);
    } catch (err) {
      this.grid.innerHTML = `<p class="error">Failed to load results. Please try again.</p>`;
    } finally {
      this.showLoading(false);
    }
  },

  async loadTrending() {
    this.showLoading(true);
    try {
      const results = await API.getTrending();
      this.renderResults(results.items);
    } catch {
      // Trending is best-effort on initial load.
    } finally {
      this.showLoading(false);
    }
  },

  renderResults(items) {
    this.grid.innerHTML = "";
    if (!items || items.length === 0) {
      this.grid.innerHTML = `<p class="no-results">No videos found.</p>`;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "video-card";
      card.innerHTML = `
        <img
          class="thumbnail"
          src="${getBestThumbnail(item.thumbnails)}"
          alt="${item.title}"
          loading="lazy"
        />
        <div class="card-info">
          <div class="card-title">${item.title}</div>
          <div class="card-channel">${item.channelTitle}</div>
          <div class="card-meta">${timeAgo(item.publishedAt)}</div>
        </div>
      `;
      card.addEventListener("click", () => Player.play(item.id));
      this.grid.appendChild(card);
    });
  },

  showLoading(show) {
    this.loading.classList.toggle("hidden", !show);
  },
};
