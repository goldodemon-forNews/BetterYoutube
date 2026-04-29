"""YouTube integration via yt-dlp — no API key required."""

import yt_dlp
import os
import json

from backend.ad_blocker import filter_search_results, filter_video_formats, detect_sponsor_segments

_COOKIE_FILE = os.path.join(os.path.expanduser("~"), ".betteryoutube", "cookies.txt")

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


def _add_cookies(opts):
    """Add cookie file to yt-dlp options if available."""
    if os.path.exists(_COOKIE_FILE):
        opts = {**opts, "cookiefile": _COOKIE_FILE}
    return opts


def search_videos(query, max_results=20):
    try:
        opts = _add_cookies({**_SEARCH_OPTS})
        with yt_dlp.YoutubeDL(opts) as ydl:
            data = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            entries = data.get("entries", []) if data else []
            items = [_fmt_entry(e) for e in entries if e]
            return {"items": filter_search_results(items)}
    except Exception as e:
        return {"items": [], "error": str(e)}


def get_trending():
    """Fetch trending/popular videos with multiple fallback strategies."""
    # Strategy 1: YouTube trending page via different URLs
    for url in [
        "https://www.youtube.com/feed/trending",
        "https://www.youtube.com/feed/trending?bp=6gQJRkVleHBsb3Jl",
    ]:
        try:
            opts = _add_cookies({**_SEARCH_OPTS})
            with yt_dlp.YoutubeDL(opts) as ydl:
                data = ydl.extract_info(url, download=False)
                if data:
                    entries = data.get("entries", [])
                    all_entries = []
                    for e in entries:
                        if e and e.get("entries"):
                            all_entries.extend(e["entries"])
                        elif e:
                            all_entries.append(e)
                    items = [_fmt_entry(e) for e in all_entries[:24] if e]
                    if len(items) >= 5:
                        return {"items": filter_search_results(items)}
        except Exception:
            pass

    # Strategy 2: Known popular playlists
    playlists = [
        "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",  # Popular right now
        "PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI",  # Top music videos
    ]
    for pl_id in playlists:
        try:
            opts = _add_cookies({**_SEARCH_OPTS})
            with yt_dlp.YoutubeDL(opts) as ydl:
                data = ydl.extract_info(
                    f"https://www.youtube.com/playlist?list={pl_id}",
                    download=False,
                )
                entries = (data.get("entries", []) if data else [])[:24]
                items = [_fmt_entry(e) for e in entries if e]
                if len(items) >= 5:
                    return {"items": filter_search_results(items)}
        except Exception:
            pass

    # Strategy 3: Search multiple queries and merge results
    merged = []
    seen_ids = set()
    queries = [
        "music video 2026",
        "most popular videos today",
        "trending music",
        "new movie trailers 2026",
        "popular gaming videos",
        "viral tiktok compilation",
        "top songs this week",
    ]
    for query in queries:
        try:
            opts = _add_cookies({**_SEARCH_OPTS})
            with yt_dlp.YoutubeDL(opts) as ydl:
                data = ydl.extract_info(f"ytsearch10:{query}", download=False)
                entries = data.get("entries", []) if data else []
                for e in entries:
                    if e:
                        vid_id = e.get("id", "")
                        if vid_id and vid_id not in seen_ids:
                            seen_ids.add(vid_id)
                            merged.append(_fmt_entry(e))
        except Exception:
            continue
        if len(merged) >= 24:
            break

    return {"items": filter_search_results(merged[:24])}


def get_personalized_feed():
    """Get personalized feed using stored cookies (requires sign-in)."""
    if not os.path.exists(_COOKIE_FILE):
        return {"items": [], "signed_in": False}

    try:
        opts = _add_cookies({**_SEARCH_OPTS})
        with yt_dlp.YoutubeDL(opts) as ydl:
            data = ydl.extract_info(
                "https://www.youtube.com/feed/subscriptions", download=False
            )
            if data:
                entries = data.get("entries", [])
                all_entries = []
                for e in entries:
                    if e and e.get("entries"):
                        all_entries.extend(e["entries"])
                    elif e:
                        all_entries.append(e)
                items = [_fmt_entry(e) for e in all_entries[:30] if e]
                if items:
                    return {"items": items, "signed_in": True}
    except Exception:
        pass

    return {"items": [], "signed_in": True}


def get_shorts():
    """Fetch trending YouTube Shorts."""
    try:
        opts = _add_cookies({**_SEARCH_OPTS})
        with yt_dlp.YoutubeDL(opts) as ydl:
            data = ydl.extract_info("ytsearch20:youtube shorts trending", download=False)
            entries = data.get("entries", []) if data else []
            items = []
            for e in entries:
                if e:
                    item = _fmt_entry(e)
                    dur = item.get("duration", 0)
                    if dur and dur <= 60:
                        item["is_short"] = True
                        items.append(item)
            if not items:
                items = [_fmt_entry(e) for e in entries if e]
                for i in items:
                    i["is_short"] = True
            return {"items": items[:20]}
    except Exception as e:
        return {"items": [], "error": str(e)}


def get_channel_info(channel_id_or_name):
    """Get channel info and recent videos."""
    try:
        # Try as channel URL
        urls = [
            f"https://www.youtube.com/channel/{channel_id_or_name}",
            f"https://www.youtube.com/@{channel_id_or_name}",
            f"https://www.youtube.com/c/{channel_id_or_name}",
        ]

        opts = _add_cookies({
            **_SEARCH_OPTS,
            "playlistend": 30,
        })

        for url in urls:
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    data = ydl.extract_info(f"{url}/videos", download=False)
                    if data:
                        entries = data.get("entries", []) or []
                        all_entries = []
                        for e in entries:
                            if e and e.get("entries"):
                                all_entries.extend(e["entries"])
                            elif e:
                                all_entries.append(e)
                        return {
                            "id": data.get("channel_id") or data.get("id", ""),
                            "name": data.get("channel") or data.get("uploader") or data.get("title", ""),
                            "description": data.get("description", ""),
                            "subscriber_count": data.get("channel_follower_count", 0),
                            "thumbnail": (data.get("thumbnails", [{}]) or [{}])[-1].get("url", ""),
                            "videos": [_fmt_entry(e) for e in all_entries[:30] if e],
                        }
            except Exception:
                continue

        # Fallback: search for the channel
        return _search_channel(channel_id_or_name)
    except Exception:
        return None


def _search_channel(name):
    """Search for a channel by name."""
    try:
        opts = _add_cookies({**_SEARCH_OPTS})
        with yt_dlp.YoutubeDL(opts) as ydl:
            data = ydl.extract_info(f"ytsearch20:{name}", download=False)
            entries = data.get("entries", []) if data else []
            items = [_fmt_entry(e) for e in entries if e]
            return {
                "id": "",
                "name": name,
                "description": "",
                "subscriber_count": 0,
                "thumbnail": "",
                "videos": items,
            }
    except Exception:
        return None


def get_video_info(video_id):
    try:
        opts = _add_cookies({**_VIDEO_OPTS})
        with yt_dlp.YoutubeDL(opts) as ydl:
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
                "channel_url": info.get("channel_url", ""),
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
        opts = _add_cookies({
            **_VIDEO_OPTS,
            "format": f"best[ext=mp4][height<={preferred_height}]/best[ext=mp4]/best[height<={preferred_height}]/best",
        })
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
                "http_headers": info.get("http_headers", {}),
            }
    except Exception:
        return None


def save_cookies(cookie_text):
    """Save cookie text in Netscape format."""
    cookie_dir = os.path.dirname(_COOKIE_FILE)
    os.makedirs(cookie_dir, exist_ok=True)
    with open(_COOKIE_FILE, "w") as f:
        f.write(cookie_text)
    return True


def is_signed_in():
    """Check if cookies file exists."""
    return os.path.exists(_COOKIE_FILE)


def sign_out():
    """Remove stored cookies."""
    if os.path.exists(_COOKIE_FILE):
        os.remove(_COOKIE_FILE)
    return True


def _fmt_entry(entry):
    thumbs = entry.get("thumbnails") or []
    thumb = thumbs[-1].get("url", "") if thumbs else ""
    if not thumb:
        vid_id = entry.get("id", "")
        if vid_id:
            thumb = f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
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
