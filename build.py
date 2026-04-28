"""Build script — packages BetterYouTube as a standalone .exe using PyInstaller."""

import PyInstaller.__main__
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

PyInstaller.__main__.run([
    os.path.join(ROOT, "main.py"),
    "--name=BetterYouTube",
    "--onefile",
    "--windowed",
    "--add-data", os.path.join(ROOT, "static") + os.pathsep + "static",
    "--add-data", os.path.join(ROOT, "backend") + os.pathsep + "backend",
    "--hidden-import=flask",
    "--hidden-import=flask_cors",
    "--hidden-import=yt_dlp",
    "--hidden-import=webview",
    "--collect-all=yt_dlp",
    "--collect-all=webview",
    "--noconfirm",
    "--clean",
])
