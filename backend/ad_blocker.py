"""Built-in ad blocker — filters ads from search results and video metadata.

Uses pattern matching on known ad-serving indicators, promoted content markers,
and sponsor patterns to provide native ad-shielding without any browser extension.
"""

# Patterns in video titles/descriptions that indicate sponsored/promoted content
TITLE_PATTERNS = [
    "sponsored",
    "promoted",
    "#ad",
    "advertisement",
    "paid promotion",
    "paid partnership",
    "this video is sponsored",
    "brought to you by",
    "thanks to our sponsor",
    "use code ",
    "use my code",
    "affiliate link",
]

# Channels that are primarily ad/promo accounts
AD_CHANNEL_PATTERNS = [
    "ad_tag",
    "youtube ads",
    "google ads",
]

# Known YouTube ad format indicators in yt-dlp metadata
AD_FORMAT_INDICATORS = [
    "ad_",
    "preroll",
    "midroll",
    "postroll",
    "bumper_ad",
]


def filter_search_results(items):
    """Remove promoted/sponsored entries from search results."""
    return [item for item in items if not _is_ad_result(item)]


def filter_video_formats(formats):
    """Remove ad-related format entries from video format lists."""
    if not formats:
        return formats
    return [f for f in formats if not _is_ad_format(f)]


def detect_sponsor_segments(description):
    """Detect likely sponsor segments from video description.

    Returns list of detected sponsor indicators (not timestamps,
    since that would require SponsorBlock API integration).
    """
    if not description:
        return []

    desc_lower = description.lower()
    detected = []

    sponsor_phrases = [
        "this video is sponsored by",
        "thanks to",
        "brought to you by",
        "sponsored by",
        "paid promotion",
        "check out our sponsor",
        "use code",
        "use my code",
        "discount code",
        "promo code",
        "affiliate",
        "special offer",
    ]

    for phrase in sponsor_phrases:
        idx = desc_lower.find(phrase)
        if idx != -1:
            # Extract context around the match
            start = max(0, idx - 10)
            end = min(len(description), idx + len(phrase) + 60)
            context = description[start:end].strip()
            detected.append({
                "type": "sponsor_mention",
                "phrase": phrase,
                "context": context,
            })

    return detected


def _is_ad_result(item):
    """Check if a search result looks like an ad."""
    title = (item.get("title") or "").lower()
    channel = (item.get("channel") or item.get("uploader") or "").lower()

    # Check title patterns
    for pattern in TITLE_PATTERNS:
        if pattern in title:
            return True

    # Check channel patterns
    for pattern in AD_CHANNEL_PATTERNS:
        if pattern in channel:
            return True

    return False


def _is_ad_format(fmt):
    """Check if a video format entry is an ad format."""
    format_id = (fmt.get("format_id") or "").lower()
    format_note = (fmt.get("format_note") or "").lower()

    for indicator in AD_FORMAT_INDICATORS:
        if indicator in format_id or indicator in format_note:
            return True

    return False
