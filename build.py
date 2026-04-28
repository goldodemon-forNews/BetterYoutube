"""Build script — packages BetterYouTube as a standalone .exe using PyInstaller."""

import PyInstaller.__main__
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

PyInstaller.__main__.run([
    os.path.join(ROOT, "main.py"),
    "--name=BetterYouTube",
    "--onefile",
    "--windowed",
    "--add-data", f"{os.path.join(ROOT, 'src')}:src",
    "--hidden-import=customtkinter",
    "--hidden-import=yt_dlp",
    "--hidden-import=PIL",
    "--collect-all=customtkinter",
    "--noconfirm",
    "--clean",
])
