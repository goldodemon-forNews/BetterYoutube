"""YouTube integration via yt-dlp — no API key required."""

import yt_dlp

from backend.ad_blocker import filter_search_results, filter_video_formats, detect_sponsor_segments

_SEARCH_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "extract_flat": True,
    "skip_download": True,
}

_VIDEO_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
}


def search_videos(query, max_results=20):
    try:
        with yt_dlp.YoutubeDL(_SEARCH_OPTS) as ydl:
            data = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            entries = data.get("entries", []) if data else []
            items = [_fmt_entry(e) for e in entries if e]
            return {"items": filter_search_results(items)}
    except Exception as e:
        return {"items": [], "error": str(e)}


def get_trending():
    """Fetch trending/popular videos with multiple fallback strategies."""
    # Strategy 1: YouTube trending page
    try:
        with yt_dlp.YoutubeDL(_SEARCH_OPTS) as ydl:
            data = ydl.extract_info(
                "https://www.youtube.com/feed/trending", download=False
            )
            entries = (data.get("entries", []) if data else [])[:24]
            items = [_fmt_entry(e) for e in entries if e]
            if items:
                return {"items": filter_search_results(items)}
    except Exception:
        pass

    # Strategy 2: YouTube popular/music charts
    try:
        with yt_dlp.YoutubeDL(_SEARCH_OPTS) as ydl:
            data = ydl.extract_info(
                "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
                download=False,
            )
            entries = (data.get("entries", []) if data else [])[:24]
            items = [_fmt_entry(e) for e in entries if e]
            if items:
                return {"items": filter_search_results(items)}
    except Exception:
        pass

    # Strategy 3: Fall back to searching popular topics
    fallback_queries = [
        "trending today",
        "popular videos 2026",
        "most viewed this week",
    ]
    for query in fallback_queries:
        try:
            result = search_videos(query, max_results=24)
            if result.get("items"):
                return result
        except Exception:
            continue

    return {"items": []}


def get_video_info(video_id):
    try:
        with yt_dlp.YoutubeDL(_VIDEO_OPTS) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}", download=False
            )
            if not info:
                return None

            formats = filter_video_formats(info.get("formats", []))
            resolutions = sorted(
                {f["height"] for f in formats if f.get("height") and f.get("vcodec") != "none"}
            )

            chapters = []
            for ch in info.get("chapters", []) or []:
                chapters.append({
                    "start": ch.get("start_time", 0),
                    "end": ch.get("end_time", 0),
                    "title": ch.get("title", ""),
                })

            return {
                "id": info.get("id", ""),
                "title": info.get("title", ""),
                "channel": info.get("uploader", info.get("channel", "")),
                "channel_id": info.get("channel_id", ""),
                "description": info.get("description", ""),
                "duration": info.get("duration", 0),
                "view_count": info.get("view_count", 0),
                "like_count": info.get("like_count", 0),
                "upload_date": info.get("upload_date", ""),
                "thumbnail": info.get("thumbnail", ""),
                "resolutions": resolutions,
                "chapters": chapters,
                "sponsor_segments": detect_sponsor_segments(info.get("description", "")),
            }
    except Exception:
        return None


def get_stream_url(video_id, preferred_height=1080):
    try:
        opts = {
            **_VIDEO_OPTS,
            "format": f"best[height<={preferred_height}]/best",
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}", download=False
            )
            if not info:
                return None
            return {
                "url": info.get("url", ""),
                "height": info.get("height", 0),
                "ext": info.get("ext", ""),
            }
    except Exception:
        return None


def _fmt_entry(entry):
    thumbs = entry.get("thumbnails") or []
    thumb = thumbs[-1].get("url", "") if thumbs else ""
    duration = entry.get("duration")
    return {
        "id": entry.get("id", ""),
        "title": entry.get("title", "Unknown"),
        "channel": entry.get("uploader") or entry.get("channel") or "Unknown",
        "channel_id": entry.get("channel_id", ""),
        "duration": int(duration) if duration else 0,
        "view_count": entry.get("view_count") or 0,
        "thumbnail": thumb,
    }

