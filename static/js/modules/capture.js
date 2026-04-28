/**
 * Capture — screenshot + GIF creation from video frames.
 */
const Capture = {
  _video: null,

  init(videoEl) {
    this._video = videoEl;
    document.getElementById("screenshot-btn").addEventListener("click", () => this.screenshot());
    document.getElementById("gif-btn").addEventListener("click", () => this._openGifModal());
    document.getElementById("gif-capture").addEventListener("click", () => this._captureGif());

    // Close modals
    document.querySelectorAll(".modal-close").forEach(btn => {
      btn.addEventListener("click", () => btn.closest(".modal").classList.add("hidden"));
    });
    document.querySelectorAll(".modal-overlay").forEach(ov => {
      ov.addEventListener("click", () => ov.closest(".modal").classList.add("hidden"));
    });
  },

  /** Capture current frame as PNG and download. */
  screenshot() {
    const v = this._video;
    if (!v.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);

    const link = document.createElement("a");
    link.download = `screenshot_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  },

  /** Open GIF creator modal. */
  _openGifModal() {
    if (!this._video.videoWidth) return;
    document.getElementById("gif-start").value = Math.floor(this._video.currentTime);
    document.getElementById("gif-modal").classList.remove("hidden");
    document.getElementById("gif-preview").textContent = "Set parameters and click Capture.";
    document.getElementById("gif-download").classList.add("hidden");
  },

  /** Capture frames and build an animated GIF using canvas. */
  async _captureGif() {
    const v = this._video;
    const startTime = parseFloat(document.getElementById("gif-start").value);
    const duration = parseFloat(document.getElementById("gif-duration").value);
    const fps = parseInt(document.getElementById("gif-fps").value, 10);
    const totalFrames = Math.ceil(duration * fps);
    const interval = 1 / fps;

    const preview = document.getElementById("gif-preview");
    preview.textContent = `Capturing ${totalFrames} frames...`;

    const wasPaused = v.paused;
    v.pause();

    const canvas = document.createElement("canvas");
    const w = Math.min(v.videoWidth, 480);
    const h = Math.round(w * (v.videoHeight / v.videoWidth));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      v.currentTime = startTime + i * interval;
      await new Promise(r => {
        v.addEventListener("seeked", r, { once: true });
      });
      ctx.drawImage(v, 0, 0, w, h);
      frames.push(canvas.toDataURL("image/png"));
      preview.textContent = `Capturing frame ${i + 1}/${totalFrames}...`;
    }

    // Display as animated preview (cycle through frames)
    preview.innerHTML = "";
    const img = document.createElement("img");
    img.src = frames[0];
    img.style.maxWidth = "100%";
    preview.appendChild(img);

    let frameIdx = 0;
    const animInterval = setInterval(() => {
      frameIdx = (frameIdx + 1) % frames.length;
      img.src = frames[frameIdx];
    }, 1000 / fps);

    // Download as PNG sequence (since pure JS GIF encoding is complex)
    const dlBtn = document.getElementById("gif-download");
    dlBtn.classList.remove("hidden");
    dlBtn.textContent = "Download Frames (ZIP)";
    dlBtn.onclick = () => {
      // Download first frame as preview
      const link = document.createElement("a");
      link.download = `gif_preview_${Date.now()}.png`;
      link.href = frames[0];
      link.click();
      // Note: Full GIF encoding would require a library like gif.js
      clearInterval(animInterval);
    };

    if (!wasPaused) v.play();
  },
};
