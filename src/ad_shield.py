"""Ad-shielding service for filtering ad content from results."""

AD_PATTERNS = [
    "ad_tag",
    "promoted",
    "sponsored",
    "#ad",
    "advertisement",
]


class AdShield:
    def __init__(self, enabled=True):
        self.enabled = enabled

    def filter_results(self, items):
        if not self.enabled:
            return items
        return [item for item in items if not self._is_ad(item)]

    def _is_ad(self, item):
        text = f"{item.get('title', '')} {item.get('channel', '')}".lower()
        return any(p in text for p in AD_PATTERNS)

    def set_enabled(self, enabled):
        self.enabled = enabled
