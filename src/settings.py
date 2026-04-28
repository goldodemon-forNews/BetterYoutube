"""Persistent user settings stored as JSON."""

import json
import os

SETTINGS_FILE = os.path.join(
    os.path.expanduser("~"), ".betteryoutube", "settings.json"
)

DEFAULTS = {
    "ad_shield_enabled": True,
    "interpolation_enabled": False,
    "interpolation_mode": "off",
    "default_resolution": "1080p",
    "theme": "dark",
}

RESOLUTIONS = ["360p", "480p", "720p", "1080p", "1440p", "2160p"]
INTERPOLATION_MODES = ["off", "2x", "4x"]


def _ensure_dir():
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)


def load():
    _ensure_dir()
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                saved = json.load(f)
            merged = {**DEFAULTS, **saved}
            return merged
        except (json.JSONDecodeError, IOError):
            pass
    return dict(DEFAULTS)


def save(settings):
    _ensure_dir()
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)


def update(key, value):
    s = load()
    s[key] = value
    save(s)
    return s
