import requests

from config import Config


class YouTubeService:
    def __init__(self):
        self.api_key = Config.YOUTUBE_API_KEY
        self.search_url = Config.YOUTUBE_SEARCH_URL
        self.video_url = Config.YOUTUBE_VIDEO_URL

    def search(self, query, max_results=20, page_token=""):
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": self.api_key,
        }
        if page_token:
            params["pageToken"] = page_token

        response = requests.get(self.search_url, params=params, timeout=10)
        if response.status_code != 200:
            return {"error": "Failed to fetch search results", "items": []}

        data = response.json()
        return {
            "items": self._format_search_results(data.get("items", [])),
            "nextPageToken": data.get("nextPageToken", ""),
            "prevPageToken": data.get("prevPageToken", ""),
            "totalResults": data.get("pageInfo", {}).get("totalResults", 0),
        }

    def get_trending(self, region="US", max_results=20):
        params = {
            "part": "snippet,statistics",
            "chart": "mostPopular",
            "regionCode": region,
            "maxResults": max_results,
            "key": self.api_key,
        }

        response = requests.get(self.video_url, params=params, timeout=10)
        if response.status_code != 200:
            return {"error": "Failed to fetch trending videos", "items": []}

        data = response.json()
        return {
            "items": self._format_video_results(data.get("items", [])),
        }

    def get_video_details(self, video_id):
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": self.api_key,
        }

        response = requests.get(self.video_url, params=params, timeout=10)
        if response.status_code != 200:
            return None

        data = response.json()
        items = data.get("items", [])
        if not items:
            return None

        item = items[0]
        return {
            "id": item["id"],
            "title": item["snippet"]["title"],
            "description": item["snippet"]["description"],
            "channelTitle": item["snippet"]["channelTitle"],
            "publishedAt": item["snippet"]["publishedAt"],
            "thumbnails": item["snippet"]["thumbnails"],
            "viewCount": item.get("statistics", {}).get("viewCount", "0"),
            "likeCount": item.get("statistics", {}).get("likeCount", "0"),
            "duration": item.get("contentDetails", {}).get("duration", ""),
        }

    def get_related_videos(self, video_id, max_results=10):
        params = {
            "part": "snippet",
            "relatedToVideoId": video_id,
            "type": "video",
            "maxResults": max_results,
            "key": self.api_key,
        }

        response = requests.get(self.search_url, params=params, timeout=10)
        if response.status_code != 200:
            return {"error": "Failed to fetch related videos", "items": []}

        data = response.json()
        return {
            "items": self._format_search_results(data.get("items", [])),
        }

    def _format_search_results(self, items):
        formatted = []
        for item in items:
            snippet = item.get("snippet", {})
            formatted.append({
                "id": item.get("id", {}).get("videoId", ""),
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channelTitle": snippet.get("channelTitle", ""),
                "publishedAt": snippet.get("publishedAt", ""),
                "thumbnails": snippet.get("thumbnails", {}),
            })
        return formatted

    def _format_video_results(self, items):
        formatted = []
        for item in items:
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            formatted.append({
                "id": item.get("id", ""),
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channelTitle": snippet.get("channelTitle", ""),
                "publishedAt": snippet.get("publishedAt", ""),
                "thumbnails": snippet.get("thumbnails", {}),
                "viewCount": stats.get("viewCount", "0"),
                "likeCount": stats.get("likeCount", "0"),
            })
        return formatted
