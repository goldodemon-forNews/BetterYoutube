"""YouTube service using yt-dlp — no API key required."""

import threading
from concurrent.futures import ThreadPoolExecutor

import yt_dlp


_executor = ThreadPoolExecutor(max_workers=4)

YDL_SEARCH_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "extract_flat": True,
    "skip_download": True,
}

YDL_VIDEO_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
}


def search_videos(query, max_results=20, callback=None):
    """Search YouTube videos. Calls callback(results) on completion."""

    def _search():
        try:
            with yt_dlp.YoutubeDL(YDL_SEARCH_OPTS) as ydl:
                result = ydl.extract_info(
                    f"ytsearch{max_results}:{query}", download=False
                )
                entries = result.get("entries", []) if result else []
                videos = []
                for entry in entries:
                    if not entry:
                        continue
                    videos.append({
                        "id": entry.get("id", ""),
                        "title": entry.get("title", "Unknown"),
                        "channel": entry.get("uploader", entry.get("channel", "Unknown")),
                        "duration": _format_duration(entry.get("duration")),
                        "view_count": _format_count(entry.get("view_count")),
                        "thumbnail": entry.get("thumbnails", [{}])[-1].get("url", "")
                        if entry.get("thumbnails")
                        else "",
                        "url": entry.get("url", entry.get("webpage_url", "")),
                    })
                if callback:
                    callback(videos)
        except Exception as e:
            print(f"Search error: {e}")
            if callback:
                callback([])

    _executor.submit(_search)


def get_video_info(video_id, callback=None):
    """Fetch detailed info for a single video."""

    def _fetch():
        try:
            with yt_dlp.YoutubeDL(YDL_VIDEO_OPTS) as ydl:
                info = ydl.extract_info(
                    f"https://www.youtube.com/watch?v={video_id}", download=False
                )
                if not info:
                    if callback:
                        callback(None)
                    return

                formats = info.get("formats", [])
                available_resolutions = sorted(
                    {
                        f.get("height")
                        for f in formats
                        if f.get("height") and f.get("vcodec") != "none"
                    }
                )

                video = {
                    "id": info.get("id", ""),
                    "title": info.get("title", "Unknown"),
                    "channel": info.get("uploader", info.get("channel", "Unknown")),
                    "description": info.get("description", ""),
                    "duration": _format_duration(info.get("duration")),
                    "view_count": _format_count(info.get("view_count")),
                    "like_count": _format_count(info.get("like_count")),
                    "upload_date": info.get("upload_date", ""),
                    "thumbnail": info.get("thumbnail", ""),
                    "available_resolutions": available_resolutions,
                    "formats": formats,
                    "webpage_url": info.get("webpage_url", ""),
                }
                if callback:
                    callback(video)
        except Exception as e:
            print(f"Video info error: {e}")
            if callback:
                callback(None)

    _executor.submit(_fetch)


def get_stream_url(video_id, preferred_height=1080, callback=None):
    """Get the best stream URL for a given resolution preference."""

    def _fetch():
        try:
            opts = {
                **YDL_VIDEO_OPTS,
                "format": f"bestvideo[height<={preferred_height}]+bestaudio/best[height<={preferred_height}]/best",
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(
                    f"https://www.youtube.com/watch?v={video_id}", download=False
                )
                url = info.get("url", "") if info else ""
                if callback:
                    callback(url)
        except Exception as e:
            print(f"Stream URL error: {e}")
            if callback:
                callback("")

    _executor.submit(_fetch)


def get_trending(callback=None):
    """Fetch trending/popular videos."""

    def _fetch():
        try:
            with yt_dlp.YoutubeDL(YDL_SEARCH_OPTS) as ydl:
                result = ydl.extract_info(
                    "https://www.youtube.com/feed/trending", download=False
                )
                entries = result.get("entries", [])[:20] if result else []
                videos = []
                for entry in entries:
                    if not entry:
                        continue
                    videos.append({
                        "id": entry.get("id", ""),
                        "title": entry.get("title", "Unknown"),
                        "channel": entry.get("uploader", entry.get("channel", "Unknown")),
                        "duration": _format_duration(entry.get("duration")),
                        "view_count": _format_count(entry.get("view_count")),
                        "thumbnail": entry.get("thumbnails", [{}])[-1].get("url", "")
                        if entry.get("thumbnails")
                        else "",
                        "url": entry.get("url", entry.get("webpage_url", "")),
                    })
                if callback:
                    callback(videos)
        except Exception as e:
            print(f"Trending error: {e}")
            if callback:
                callback([])

    _executor.submit(_fetch)


def _format_duration(seconds):
    if not seconds:
        return ""
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def _format_count(count):
    if count is None:
        return ""
    count = int(count)
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M".replace(".0M", "M")
    if count >= 1_000:
        return f"{count / 1_000:.1f}K".replace(".0K", "K")
    return str(count)
