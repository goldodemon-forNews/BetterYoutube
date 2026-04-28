from flask import Blueprint, request, jsonify

from services.youtube import YouTubeService

search_bp = Blueprint("search", __name__)
youtube_service = YouTubeService()


@search_bp.route("/search", methods=["GET"])
def search_videos():
    query = request.args.get("q", "")
    max_results = request.args.get("maxResults", 20, type=int)
    page_token = request.args.get("pageToken", "")

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    results = youtube_service.search(
        query=query,
        max_results=min(max_results, 50),
        page_token=page_token,
    )
    return jsonify(results)


@search_bp.route("/trending", methods=["GET"])
def trending_videos():
    region = request.args.get("region", "US")
    max_results = request.args.get("maxResults", 20, type=int)

    results = youtube_service.get_trending(
        region=region,
        max_results=min(max_results, 50),
    )
    return jsonify(results)
