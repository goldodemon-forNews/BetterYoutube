/**
 * Video player component — embeds YouTube videos via iframe.
 */
const Player = {
  container: null,
  section: null,

  init() {
    this.container = document.getElementById("player-container");
    this.section = document.getElementById("player-section");
  },

  play(videoId) {
    this.section.classList.remove("hidden");

    this.container.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;

    this._loadVideoInfo(videoId);
    this.section.scrollIntoView({ behavior: "smooth" });
  },

  async _loadVideoInfo(videoId) {
    try {
      const video = await API.getVideo(videoId);
      document.getElementById("video-title").textContent = video.title;
      document.getElementById("video-channel").textContent = video.channelTitle;
      document.getElementById("video-views").textContent =
        formatCount(video.viewCount) + " views";
      document.getElementById("video-date").textContent = timeAgo(
        video.publishedAt
      );
      document.getElementById("video-description").textContent =
        video.description;
    } catch {
      // Video info is supplementary; don't block playback.
    }
  },

  hide() {
    this.section.classList.add("hidden");
    this.container.innerHTML = "";
  },
};
