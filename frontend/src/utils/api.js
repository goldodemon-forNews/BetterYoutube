/**
 * API client for the BetterYouTube backend.
 */
const API = {
  baseUrl: "/api",

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.status}`);
      }
      return response.json();
    } catch (err) {
      console.error(`API error [${endpoint}]:`, err);
      throw err;
    }
  },

  searchVideos(query, maxResults = 20, pageToken = "") {
    const params = new URLSearchParams({ q: query, maxResults, pageToken });
    return this.request(`/search?${params}`);
  },

  getTrending(region = "US", maxResults = 20) {
    const params = new URLSearchParams({ region, maxResults });
    return this.request(`/trending?${params}`);
  },

  getVideo(videoId) {
    return this.request(`/video/${videoId}`);
  },

  getRelatedVideos(videoId, maxResults = 10) {
    const params = new URLSearchParams({ maxResults });
    return this.request(`/video/${videoId}/related?${params}`);
  },

  getSettings() {
    return this.request("/settings");
  },

  updateSettings(settings) {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};
