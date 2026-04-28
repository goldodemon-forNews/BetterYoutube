"""BetterYouTube — Desktop Application."""

import io
import threading
import webbrowser

import customtkinter as ctk
from PIL import Image
import requests

from src import settings as settings_mod
from src import youtube_service
from src.ad_shield import AdShield


ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

ACCENT = "#ff4444"
BG_DARK = "#0f0f0f"
BG_CARD = "#1a1a1a"
BG_SECONDARY = "#212121"
TEXT_DIM = "#888888"


class ThumbnailLoader:
    """Loads thumbnails from URLs in background threads."""

    _cache = {}

    @classmethod
    def load(cls, url, size=(320, 180), callback=None):
        if not url:
            if callback:
                callback(None)
            return

        cache_key = (url, size)
        if cache_key in cls._cache:
            if callback:
                callback(cls._cache[cache_key])
            return

        def _fetch():
            try:
                resp = requests.get(url, timeout=8)
                img = Image.open(io.BytesIO(resp.content))
                img = img.resize(size, Image.LANCZOS)
                ctk_img = ctk.CTkImage(light_image=img, dark_image=img, size=size)
                cls._cache[cache_key] = ctk_img
                if callback:
                    callback(ctk_img)
            except Exception:
                if callback:
                    callback(None)

        threading.Thread(target=_fetch, daemon=True).start()


class VideoCard(ctk.CTkFrame):
    """A clickable video card with thumbnail, title, and meta info."""

    def __init__(self, master, video_data, on_click=None, **kwargs):
        super().__init__(master, fg_color=BG_CARD, corner_radius=8, **kwargs)
        self.video_data = video_data
        self.on_click = on_click

        self.thumbnail_label = ctk.CTkLabel(
            self, text="Loading...", width=320, height=180,
            fg_color="#111111", corner_radius=6
        )
        self.thumbnail_label.pack(padx=6, pady=(6, 2))

        self.title_label = ctk.CTkLabel(
            self, text=video_data.get("title", ""),
            font=ctk.CTkFont(size=13, weight="bold"),
            wraplength=300, justify="left", anchor="w"
        )
        self.title_label.pack(padx=8, pady=(4, 0), fill="x")

        channel = video_data.get("channel", "")
        meta_parts = [channel]
        if video_data.get("view_count"):
            meta_parts.append(f"{video_data['view_count']} views")
        if video_data.get("duration"):
            meta_parts.append(video_data["duration"])
        meta_text = " · ".join(meta_parts)

        self.meta_label = ctk.CTkLabel(
            self, text=meta_text,
            font=ctk.CTkFont(size=11),
            text_color=TEXT_DIM, anchor="w"
        )
        self.meta_label.pack(padx=8, pady=(0, 6), fill="x")

        for widget in [self, self.thumbnail_label, self.title_label, self.meta_label]:
            widget.bind("<Button-1>", self._on_click)
            widget.configure(cursor="hand2")

        ThumbnailLoader.load(
            video_data.get("thumbnail", ""),
            size=(320, 180),
            callback=self._set_thumbnail,
        )

    def _set_thumbnail(self, ctk_image):
        if ctk_image:
            self.after(0, lambda: self.thumbnail_label.configure(image=ctk_image, text=""))

    def _on_click(self, event=None):
        if self.on_click:
            self.on_click(self.video_data)


class SettingsWindow(ctk.CTkToplevel):
    """Settings modal window."""

    def __init__(self, master, current_settings, on_save=None):
        super().__init__(master)
        self.title("Settings")
        self.geometry("400x350")
        self.resizable(False, False)
        self.configure(fg_color=BG_DARK)
        self.on_save = on_save
        self.settings = dict(current_settings)

        self.transient(master)
        self.grab_set()

        header = ctk.CTkLabel(
            self, text="Settings",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        header.pack(pady=(20, 16))

        # Ad Shield toggle
        ad_frame = ctk.CTkFrame(self, fg_color=BG_SECONDARY, corner_radius=8)
        ad_frame.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(ad_frame, text="Ad Shield", font=ctk.CTkFont(size=14)).pack(
            side="left", padx=12, pady=12
        )
        self.ad_switch = ctk.CTkSwitch(
            ad_frame, text="", onvalue=True, offvalue=False,
            command=self._on_ad_toggle
        )
        self.ad_switch.pack(side="right", padx=12, pady=12)
        if self.settings.get("ad_shield_enabled"):
            self.ad_switch.select()

        # Interpolation toggle
        interp_frame = ctk.CTkFrame(self, fg_color=BG_SECONDARY, corner_radius=8)
        interp_frame.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(interp_frame, text="AI Frame Interpolation", font=ctk.CTkFont(size=14)).pack(
            side="left", padx=12, pady=12
        )
        self.interp_switch = ctk.CTkSwitch(
            interp_frame, text="", onvalue=True, offvalue=False,
            command=self._on_interp_toggle
        )
        self.interp_switch.pack(side="right", padx=12, pady=12)
        if self.settings.get("interpolation_enabled"):
            self.interp_switch.select()

        # Resolution selector
        res_frame = ctk.CTkFrame(self, fg_color=BG_SECONDARY, corner_radius=8)
        res_frame.pack(fill="x", padx=20, pady=4)
        ctk.CTkLabel(res_frame, text="Default Resolution", font=ctk.CTkFont(size=14)).pack(
            side="left", padx=12, pady=12
        )
        self.res_menu = ctk.CTkOptionMenu(
            res_frame, values=settings_mod.RESOLUTIONS,
            command=self._on_res_change, width=100
        )
        self.res_menu.set(self.settings.get("default_resolution", "1080p"))
        self.res_menu.pack(side="right", padx=12, pady=12)

        # Save button
        save_btn = ctk.CTkButton(
            self, text="Save", font=ctk.CTkFont(size=14, weight="bold"),
            fg_color=ACCENT, hover_color="#cc3333",
            command=self._save, width=120
        )
        save_btn.pack(pady=20)

    def _on_ad_toggle(self):
        self.settings["ad_shield_enabled"] = self.ad_switch.get()

    def _on_interp_toggle(self):
        self.settings["interpolation_enabled"] = self.interp_switch.get()

    def _on_res_change(self, value):
        self.settings["default_resolution"] = value

    def _save(self):
        settings_mod.save(self.settings)
        if self.on_save:
            self.on_save(self.settings)
        self.destroy()


class BetterYouTubeApp(ctk.CTk):
    """Main application window."""

    def __init__(self):
        super().__init__()
        self.title("BetterYouTube")
        self.geometry("1100x700")
        self.minsize(800, 500)
        self.configure(fg_color=BG_DARK)

        self.user_settings = settings_mod.load()
        self.ad_shield = AdShield(self.user_settings.get("ad_shield_enabled", True))
        self.current_videos = []
        self._settings_window = None

        self._build_header()
        self._build_content()

        self.after(100, self._load_trending)

    def _build_header(self):
        header = ctk.CTkFrame(self, fg_color=BG_CARD, corner_radius=0, height=56)
        header.pack(fill="x")
        header.pack_propagate(False)

        # Logo
        logo = ctk.CTkLabel(
            header, text="Better",
            font=ctk.CTkFont(size=20, weight="bold"),
        )
        logo.pack(side="left", padx=(16, 0), pady=10)
        logo_accent = ctk.CTkLabel(
            header, text="YouTube",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=ACCENT,
        )
        logo_accent.pack(side="left", pady=10)

        for widget in [logo, logo_accent]:
            widget.bind("<Button-1>", lambda e: self._load_trending())
            widget.configure(cursor="hand2")

        # Settings button
        settings_btn = ctk.CTkButton(
            header, text="⚙", width=40, height=36,
            fg_color="transparent", hover_color=BG_SECONDARY,
            font=ctk.CTkFont(size=18),
            command=self._open_settings,
        )
        settings_btn.pack(side="right", padx=16, pady=10)

        # Search bar
        search_frame = ctk.CTkFrame(header, fg_color="transparent")
        search_frame.pack(side="right", fill="x", expand=True, padx=20, pady=10)

        self.search_entry = ctk.CTkEntry(
            search_frame, placeholder_text="Search videos...",
            height=36, font=ctk.CTkFont(size=14),
            corner_radius=18,
        )
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.search_entry.bind("<Return>", lambda e: self._perform_search())

        search_btn = ctk.CTkButton(
            search_frame, text="Search", width=80, height=36,
            fg_color=ACCENT, hover_color="#cc3333",
            font=ctk.CTkFont(size=13, weight="bold"),
            corner_radius=18,
            command=self._perform_search,
        )
        search_btn.pack(side="left")

    def _build_content(self):
        self.content_frame = ctk.CTkScrollableFrame(
            self, fg_color=BG_DARK, corner_radius=0
        )
        self.content_frame.pack(fill="both", expand=True, padx=0, pady=0)

        self.status_label = ctk.CTkLabel(
            self.content_frame, text="Loading trending videos...",
            font=ctk.CTkFont(size=14), text_color=TEXT_DIM
        )
        self.status_label.pack(pady=40)

        self.grid_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.grid_frame.pack(fill="both", expand=True, padx=16, pady=8)

    def _load_trending(self):
        self.search_entry.delete(0, "end")
        self._show_status("Loading trending videos...")
        youtube_service.get_trending(callback=self._on_results)

    def _perform_search(self):
        query = self.search_entry.get().strip()
        if not query:
            return
        self._show_status(f"Searching \"{query}\"...")
        youtube_service.search_videos(query, max_results=20, callback=self._on_results)

    def _on_results(self, videos):
        self.after(0, lambda: self._display_results(videos))

    def _display_results(self, videos):
        if videos:
            videos = self.ad_shield.filter_results(videos)
        self.current_videos = videos

        for widget in self.grid_frame.winfo_children():
            widget.destroy()

        if not videos:
            self._show_status("No videos found.")
            return

        self.status_label.pack_forget()

        columns = max(1, self.winfo_width() // 350)
        for i, video in enumerate(videos):
            row, col = divmod(i, columns)
            card = VideoCard(
                self.grid_frame, video,
                on_click=self._play_video,
            )
            card.grid(row=row, column=col, padx=8, pady=8, sticky="nsew")

        for c in range(columns):
            self.grid_frame.columnconfigure(c, weight=1)

    def _play_video(self, video_data):
        video_id = video_data.get("id", "")
        if video_id:
            url = f"https://www.youtube.com/watch?v={video_id}"
            webbrowser.open(url)

    def _show_status(self, text):
        for widget in self.grid_frame.winfo_children():
            widget.destroy()
        self.status_label.configure(text=text)
        self.status_label.pack(pady=40)

    def _open_settings(self):
        if self._settings_window is not None and self._settings_window.winfo_exists():
            self._settings_window.focus()
            return
        self._settings_window = SettingsWindow(
            self, self.user_settings, on_save=self._on_settings_saved
        )

    def _on_settings_saved(self, new_settings):
        self.user_settings = new_settings
        self.ad_shield.set_enabled(new_settings.get("ad_shield_enabled", True))
        if self.current_videos:
            self._display_results(self.current_videos)


def main():
    app = BetterYouTubeApp()
    app.mainloop()


if __name__ == "__main__":
    main()
