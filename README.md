# BetterYouTube

BetterYouTube is a standalone desktop application that leverages YouTube's infrastructure to provide high-performance video discovery alongside integrated ad-shielding, granular resolution scaling, and toggleable AI-driven frame interpolation for an optimized, high-fidelity viewing experience.

**No API keys. No setup. Just download and run.**

## Features

- **Video Discovery** — Search and browse YouTube videos with a clean, distraction-free interface
- **Ad Shielding** — Integrated ad-filtering for uninterrupted browsing
- **Resolution Scaling** — Granular control over default video resolution
- **AI Frame Interpolation** — Toggleable interpolation mode (2x / 4x) for smoother playback
- **Custom Dark GUI** — Modern CustomTkinter interface with a dark theme
- **Standalone .exe** — Packaged with PyInstaller, no Python install needed

## Screenshots

*Coming soon*

## Tech Stack

- **GUI:** Python + [CustomTkinter](https://github.com/TomSchimansky/CustomTkinter) — modern, dark-themed desktop UI
- **YouTube Integration:** [yt-dlp](https://github.com/yt-dlp/yt-dlp) — no API key required
- **Packaging:** [PyInstaller](https://pyinstaller.org/) — single-file .exe

## Project Structure

```
BetterYoutube/
├── main.py                  # Application entry point
├── build.py                 # PyInstaller build script
├── src/
│   ├── app.py               # Main GUI application
│   ├── youtube_service.py   # YouTube search/video (yt-dlp)
│   ├── ad_shield.py         # Ad-shielding filter
│   └── settings.py          # Persistent user settings
├── assets/                  # Icons, images (future)
├── requirements.txt
├── .gitignore
└── LICENSE
```

## Getting Started

### Option 1: Download the .exe (Windows)

1. Go to the [Releases](https://github.com/goldodemon-forNews/BetterYoutube/releases) page
2. Download `BetterYouTube.exe`
3. Run it — that's it!

### Option 2: Run from Source

1. **Clone the repository:**
   ```bash
   git clone https://github.com/goldodemon-forNews/BetterYoutube.git
   cd BetterYoutube
   ```

2. **Install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run the app:**
   ```bash
   python main.py
   ```

### Build the .exe Yourself

```bash
python build.py
```

The executable will be in the `dist/` folder.

## Settings

Settings are saved to `~/.betteryoutube/settings.json` and persist across sessions.

| Setting | Description | Default |
|---------|-------------|---------|
| Ad Shield | Filter out promoted/sponsored results | Enabled |
| AI Interpolation | Frame interpolation mode (off/2x/4x) | Off |
| Default Resolution | Preferred video quality | 1080p |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
