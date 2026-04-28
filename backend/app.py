"""BetterYouTube — Flask backend serving the rich web frontend."""

import os
import sys
import threading
import socket

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from backend.youtube import search_videos, get_trending, get_video_info, get_stream_url


def _get_root_dir():
    """Resolve root dir for both normal and PyInstaller-bundled execution."""
    if getattr(sys, "frozen", False):
        return sys._MEIPASS
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _find_free_port():
    """Find a free port so we don't conflict with anything."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


ROOT_DIR = _get_root_dir()
STATIC_DIR = os.path.join(ROOT_DIR, "static")


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
    import webview

    port = _find_free_port()
    app = create_app()

    def start_server():
        app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Create a native desktop window
    webview.create_window(
        "BetterYouTube",
        f"http://127.0.0.1:{port}",
        width=1200,
        height=800,
        min_size=(800, 500),
    )
    webview.start()
