# BetterYouTube

A **power-user YouTube workstation** — a local web application with an advanced custom video player packed with features you won't find on stock YouTube.

**No API keys. No accounts. Just download and run.**

## Features

### Video Filters (CSS/SVG real-time processing)
- **Night Vision** — boosts brightness/contrast for dark footage
- **Vivid Colors** — cranks up saturation for vibrant visuals
- **Grayscale** — classic black & white
- **Sepia / Vintage** — retro cinema aesthetic
- **Warm / Blue Light Filter** — reduces eye strain for long sessions
- **Custom sliders** — fine-tune brightness, contrast, saturation independently

### Audio Engine (Web Audio API)
- **Volume Normalization** — compresses dynamic range for consistent audio
- **Equalizer** — 6-band EQ with presets: Flat, Podcast, Music, Bass Heavy, Treble
- **Bass Boost** — toggleable low-frequency enhancement

### Playback Controls
- **Granular speed** — 0.25x to 5.00x in 0.05x increments
- **Frame-by-frame stepping** — forward/backward (1/30s precision)
- **A-B Looping** — repeat any segment infinitely

### Zen Modes
- **Ambilight** — dynamic edge-glow from video colors (like Philips Ambilight)
- **Focus / Cinema Mode** — hides everything except the video

### Capture Tools
- **One-click screenshot** — captures current frame at native resolution
- **GIF Maker** — extract frames from any segment into animated previews

### Smart Features
- **Auto-resume** — remembers your position across sessions
- **Volume memory per channel** — each channel gets its own volume level
- **Bandwidth Saver** — detects background tabs for resource management
- **Timestamp bookmarks** — save and jump to key moments

### Extras
- **Keyboard shortcuts** — full hotkey support (press `?` to see all)
- **Picture-in-Picture** — float the video over other windows
- **Mini player bar** — persistent playback controls
- **Chapter markers** — visual markers on the progress bar
- **Ad filtering** — filters promoted/sponsored content from search results

## Tech Stack

- **Backend:** Python + Flask + [yt-dlp](https://github.com/yt-dlp/yt-dlp) (no API key needed)
- **Frontend:** Vanilla JS with Web Audio API, Canvas API, CSS Filters
- **Packaging:** [PyInstaller](https://pyinstaller.org/) for standalone .exe

## Getting Started

### Option 1: Download the .exe (Windows)

1. Go to [Releases](https://github.com/goldodemon-forNews/BetterYoutube/releases)
2. Download `BetterYouTube.exe`
3. Run it — your browser opens automatically

### Option 2: Run from Source

```bash
git clone https://github.com/goldodemon-forNews/BetterYoutube.git
cd BetterYoutube
pip install -r requirements.txt
python main.py
```

### Build the .exe Yourself

```bash
python build.py
# Output: dist/BetterYouTube.exe
```

### Ad Blocking

For full ad blocking during video playback, install [PIE Adblock](https://chromewebstore.google.com/detail/pie-adblock-a-powerful-fr/jpkfgepcmmchgfbjblnodjhldacghenp) in your browser alongside BetterYouTube.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` `→` | Seek ±5s |
| `J` `L` | Seek ±10s |
| `Shift+←` `→` | Frame step |
| `↑` `↓` | Volume ±5% |
| `M` | Mute / Unmute |
| `<` `>` | Speed ±0.25x |
| `Shift+<` `>` | Speed ±0.05x |
| `F` | Fullscreen |
| `P` | Picture-in-Picture |
| `S` | Screenshot |
| `A` | Set A-B loop point |
| `Z` | Toggle Zen / Focus mode |
| `B` | Toggle Ambilight |
| `?` | Show all shortcuts |

## Project Structure

```
BetterYoutube/
├── main.py                  # Entry point (launches server + browser)
├── build.py                 # PyInstaller build script
├── backend/
│   ├── app.py               # Flask server & API routes
│   └── youtube.py           # yt-dlp integration (search, stream, info)
├── static/
│   ├── index.html           # Main UI
│   ├── css/
│   │   ├── main.css         # Core styles
│   │   ├── player.css       # Player & controls
│   │   └── filters.css      # CSS video filter presets
│   └── js/
│       ├── app.js           # App initialization
│       └── modules/
│           ├── store.js     # localStorage persistence
│           ├── api.js       # Backend API client
│           ├── player.js    # Video player & controls
│           ├── filters.js   # Visual filter management
│           ├── audio-engine.js  # Web Audio API (EQ, normalization)
│           ├── capture.js   # Screenshot & GIF maker
│           └── grid.js      # Video grid & search
├── requirements.txt
├── .gitignore
└── LICENSE
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.
