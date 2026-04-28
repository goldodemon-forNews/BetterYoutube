"""AI-driven frame interpolation service.

Provides toggleable frame interpolation to enhance video playback
smoothness by generating intermediate frames between existing ones.
"""


SUPPORTED_MODES = ["off", "2x", "4x"]
DEFAULT_MODE = "off"


class InterpolationService:
    def __init__(self, enabled=False):
        self.enabled = enabled
        self.mode = DEFAULT_MODE

    def get_status(self):
        return {
            "enabled": self.enabled,
            "mode": self.mode,
            "supported_modes": SUPPORTED_MODES,
        }

    def set_enabled(self, enabled):
        self.enabled = enabled
        if not enabled:
            self.mode = "off"

    def set_mode(self, mode):
        if mode not in SUPPORTED_MODES:
            raise ValueError(f"Unsupported mode: {mode}. Use one of {SUPPORTED_MODES}")
        self.mode = mode
        self.enabled = mode != "off"

    def get_interpolation_params(self):
        if not self.enabled or self.mode == "off":
            return None
        return {
            "mode": self.mode,
            "factor": int(self.mode.replace("x", "")),
        }
