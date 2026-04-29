"""BetterYouTube — Flask backend serving the rich web frontend."""

import os
import sys
import threading
import socket

import requests as http_requests
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

from backend.youtube import (
    search_videos, get_trending, get_video_info, get_stream_url,
    get_personalized_feed, get_shorts, get_channel_info,
    save_cookies, is_signed_in, sign_out,
)


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

    # ── Serve frontend ────────────────────────────────────────────
    @app.route("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    # ── Search ────────────────────────────────────────────────────
    @app.route("/api/search")
    def api_search():
        q = request.args.get("q", "").strip()
        if not q:
            return jsonify({"error": "query required"}), 400
        max_results = request.args.get("max", 20, type=int)
        return jsonify(search_videos(q, max_results))

    # ── Trending ──────────────────────────────────────────────────
    @app.route("/api/trending")
    def api_trending():
        return jsonify(get_trending())

    # ── Personalized feed ─────────────────────────────────────────
    @app.route("/api/feed")
    def api_feed():
        return jsonify(get_personalized_feed())

    # ── Shorts ────────────────────────────────────────────────────
    @app.route("/api/shorts")
    def api_shorts():
        return jsonify(get_shorts())

    # ── Channel ───────────────────────────────────────────────────
    @app.route("/api/channel/<path:channel_id>")
    def api_channel(channel_id):
        info = get_channel_info(channel_id)
        if not info:
            return jsonify({"error": "channel not found"}), 404
        return jsonify(info)

    # ── Video details ─────────────────────────────────────────────
    @app.route("/api/video/<video_id>")
    def api_video(video_id):
        info = get_video_info(video_id)
        if not info:
            return jsonify({"error": "not found"}), 404
        return jsonify(info)

    # ── Stream URL ────────────────────────────────────────────────
    @app.route("/api/stream/<video_id>")
    def api_stream(video_id):
        height = request.args.get("h", 1080, type=int)
        result = get_stream_url(video_id, height)
        if not result:
            return jsonify({"error": "stream unavailable"}), 404
        return jsonify(result)

    # ── Video proxy (solves CORS / direct playback issues) ────────
    @app.route("/api/proxy/<video_id>")
    def api_proxy(video_id):
        height = request.args.get("h", 720, type=int)
        result = get_stream_url(video_id, height)
        if not result or not result.get("url"):
            return Response("Stream not available", status=404)

        stream_url = result["url"]
        headers = result.get("http_headers", {})

        # Forward range requests for seeking support
        range_header = request.headers.get("Range")
        if range_header:
            headers["Range"] = range_header

        try:
            resp = http_requests.get(stream_url, headers=headers, stream=True, timeout=30)

            excluded = {"content-encoding", "transfer-encoding", "connection"}
            response_headers = {
                k: v for k, v in resp.headers.items()
                if k.lower() not in excluded
            }
            response_headers["Access-Control-Allow-Origin"] = "*"
            response_headers["Accept-Ranges"] = "bytes"

            def generate():
                for chunk in resp.iter_content(chunk_size=64 * 1024):
                    yield chunk

            return Response(
                generate(),
                status=resp.status_code,
                headers=response_headers,
                content_type=resp.headers.get("Content-Type", "video/mp4"),
            )
        except Exception:
            return Response("Proxy error", status=502)

    # ── Auth endpoints ────────────────────────────────────────────
    @app.route("/api/auth/status")
    def api_auth_status():
        return jsonify({"signed_in": is_signed_in()})

    @app.route("/api/auth/signin", methods=["POST"])
    def api_auth_signin():
        data = request.get_json(silent=True) or {}
        cookies = data.get("cookies", "")
        if not cookies:
            return jsonify({"error": "cookies required"}), 400
        save_cookies(cookies)
        return jsonify({"success": True})

    @app.route("/api/auth/signout", methods=["POST"])
    def api_auth_signout():
        sign_out()
        return jsonify({"success": True})

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
        width=1280,
        height=850,
        min_size=(800, 500),
    )
    webview.start()
