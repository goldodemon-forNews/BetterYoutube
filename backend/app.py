from flask import Flask
from flask_cors import CORS

from config import Config
from routes.search import search_bp
from routes.video import video_bp
from routes.settings import settings_bp


def create_app():
    app = Flask(
        __name__,
        static_folder="../frontend/public",
        static_url_path="",
    )
    app.config.from_object(Config)
    CORS(app)

    app.register_blueprint(search_bp, url_prefix="/api")
    app.register_blueprint(video_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG,
    )
