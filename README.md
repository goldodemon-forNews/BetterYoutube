# BetterYouTube

BetterYouTube is a streamlined web interface that leverages YouTube's infrastructure to provide high-performance video discovery alongside integrated ad-shielding, granular resolution scaling, and toggleable AI-driven frame interpolation for an optimized, high-fidelity viewing experience.

## Features

- **Video Discovery** — Search and browse YouTube videos with a clean, distraction-free interface
- **Ad Shielding** — Integrated ad-blocking for uninterrupted viewing
- **Resolution Scaling** — Granular control over video quality and resolution
- **AI Frame Interpolation** — Toggleable AI-driven frame interpolation for smoother playback
- **Clean UI** — Minimalist, responsive interface focused on content

## Tech Stack

- **Backend:** Python (Flask) — API proxy, configuration management, and server-side logic
- **Frontend:** JavaScript (Vanilla JS) — Lightweight, fast client-side application

## Project Structure

```
BetterYoutube/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── config.py           # Configuration management
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── search.py       # Video search endpoints
│   │   ├── video.py        # Video playback endpoints
│   │   └── settings.py     # User settings endpoints
│   └── services/
│       ├── __init__.py
│       ├── youtube.py       # YouTube API integration
│       ├── ad_shield.py     # Ad-shielding logic
│       └── interpolation.py # Frame interpolation service
├── frontend/
│   ├── public/
│   │   └── index.html       # Main HTML entry point
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── player.js    # Video player component
│   │   │   ├── search.js    # Search bar component
│   │   │   └── settings.js  # Settings panel component
│   │   ├── styles/
│   │   │   └── main.css     # Application styles
│   │   ├── utils/
│   │   │   ├── api.js       # Backend API client
│   │   │   └── helpers.js   # Utility functions
│   │   └── app.js           # Main application script
│   └── package.json         # Frontend dependencies
├── tests/
│   ├── test_search.py       # Search endpoint tests
│   └── test_video.py        # Video endpoint tests
├── requirements.txt         # Python dependencies
├── .gitignore
├── .env.example             # Environment variable template
└── LICENSE
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend tooling)
- A YouTube Data API key ([Get one here](https://console.cloud.google.com/apis/credentials))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/goldodemon-forNews/BetterYoutube.git
   cd BetterYoutube
   ```

2. **Set up the backend:**
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your YouTube Data API key
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Run the application:**
   ```bash
   python backend/app.py
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5000`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | *required* |
| `FLASK_PORT` | Server port | `5000` |
| `FLASK_DEBUG` | Enable debug mode | `false` |
| `AD_SHIELD_ENABLED` | Enable ad-shielding | `true` |
| `INTERPOLATION_ENABLED` | Enable AI frame interpolation | `false` |
| `DEFAULT_RESOLUTION` | Default video resolution | `1080p` |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
