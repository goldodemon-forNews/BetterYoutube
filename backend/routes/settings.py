from flask import Blueprint, request, jsonify

from config import Config

settings_bp = Blueprint("settings", __name__)

_user_settings = {
    "ad_shield_enabled": Config.AD_SHIELD_ENABLED,
    "interpolation_enabled": Config.INTERPOLATION_ENABLED,
    "default_resolution": Config.DEFAULT_RESOLUTION,
}


@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    return jsonify(_user_settings)


@settings_bp.route("/settings", methods=["PUT"])
def update_settings():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    allowed_keys = {"ad_shield_enabled", "interpolation_enabled", "default_resolution"}
    for key, value in data.items():
        if key in allowed_keys:
            _user_settings[key] = value

    return jsonify(_user_settings)
