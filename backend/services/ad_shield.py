"""Ad-shielding service for filtering and blocking ad content."""


# Known ad-serving domains to block
AD_DOMAINS = [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "youtube-ad.l.google.com",
    "pagead2.googlesyndication.com",
]

# Patterns indicating ad content in video responses
AD_PATTERNS = [
    "ad_tag",
    "promoted",
    "sponsored",
]


class AdShieldService:
    def __init__(self, enabled=True):
        self.enabled = enabled

    def is_ad_domain(self, url):
        if not self.enabled:
            return False
        return any(domain in url for domain in AD_DOMAINS)

    def filter_ad_content(self, items):
        if not self.enabled:
            return items
        return [
            item for item in items
            if not self._is_ad_item(item)
        ]

    def _is_ad_item(self, item):
        title = item.get("title", "").lower()
        description = item.get("description", "").lower()
        text = f"{title} {description}"
        return any(pattern in text for pattern in AD_PATTERNS)

    def set_enabled(self, enabled):
        self.enabled = enabled
