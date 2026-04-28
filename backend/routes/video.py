from flask import Blueprint, request, jsonify

from services.youtube import YouTubeService

video_bp = Blueprint("video", __name__)
youtube_service = YouTubeService()


@video_bp.route("/video/<video_id>", methods=["GET"])
def get_video(video_id):
    video = youtube_service.get_video_details(video_id)
    if not video:
        return jsonify({"error": "Video not found"}), 404
    return jsonify(video)


@video_bp.route("/video/<video_id>/related", methods=["GET"])
def get_related(video_id):
    max_results = request.args.get("maxResults", 10, type=int)
    results = youtube_service.get_related_videos(
        video_id=video_id,
        max_results=min(max_results, 50),
    )
    return jsonify(results)
