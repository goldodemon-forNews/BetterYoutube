import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    AD_SHIELD_ENABLED = os.getenv("AD_SHIELD_ENABLED", "true").lower() == "true"
    INTERPOLATION_ENABLED = os.getenv("INTERPOLATION_ENABLED", "false").lower() == "true"
    DEFAULT_RESOLUTION = os.getenv("DEFAULT_RESOLUTION", "1080p")

    YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
    YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos"
