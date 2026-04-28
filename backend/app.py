"""BetterYouTube — Flask backend serving the rich web frontend."""

import os
import webbrowser
import threading

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from backend.youtube import search_videos, get_trending, get_video_info, get_stream_url

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STATIC_DIR = os.path.join(ROOT_DIR, "static")
PORT = int(os.getenv("BETTERYOUTUBE_PORT", "5000"))


def create_app():
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
    CORS(app)

    # ── Serve frontend ────────────────────────────────────────────────
    @app.route("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    # ── Search ────────────────────────────────────────────────────────
    @app.route("/api/search")
    def api_search():
        q = request.args.get("q", "").strip()
        if not q:
            return jsonify({"error": "query required"}), 400
        max_results = request.args.get("max", 20, type=int)
        return jsonify(search_videos(q, max_results))

    # ── Trending ──────────────────────────────────────────────────────
    @app.route("/api/trending")
    def api_trending():
        return jsonify(get_trending())

    # ── Video details ─────────────────────────────────────────────────
    @app.route("/api/video/<video_id>")
    def api_video(video_id):
        info = get_video_info(video_id)
        if not info:
            return jsonify({"error": "not found"}), 404
        return jsonify(info)

    # ── Stream URL ────────────────────────────────────────────────────
    @app.route("/api/stream/<video_id>")
    def api_stream(video_id):
        height = request.args.get("h", 1080, type=int)
        result = get_stream_url(video_id, height)
        if not result:
            return jsonify({"error": "stream unavailable"}), 404
        return jsonify(result)

    return app


def run():
    app = create_app()

    def open_browser():
        webbrowser.open(f"http://localhost:{PORT}")

    threading.Timer(1.0, open_browser).start()
    app.run(host="127.0.0.1", port=PORT, debug=False)
