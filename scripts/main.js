import { initLastfm } from "./lastfm.js";
import { initYouTube } from "./youtube.js";
import { initBooks } from "./books.js";
import { initStrava } from "./strava.js";
import { config } from "./config.js";

const getSettings = async () => {
  const fallback = {
    liveDataEnabled: config.liveDataEnabled !== false,
    stravaEnabled: config.strava?.enabled !== false,
  };

  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      return {
        liveDataEnabled:
          typeof data.liveDataEnabled === "boolean"
            ? data.liveDataEnabled
            : fallback.liveDataEnabled,
        stravaEnabled:
          typeof data.stravaEnabled === "boolean"
            ? data.stravaEnabled
            : fallback.stravaEnabled,
      };
    }
  } catch (error) {
    // Settings endpoint not available.
  }

  return fallback;
};

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSettings();
  initLastfm({ liveDataEnabled: settings.liveDataEnabled });
  initYouTube({ liveDataEnabled: settings.liveDataEnabled });
  initBooks({ liveDataEnabled: settings.liveDataEnabled });
  initStrava({
    liveDataEnabled: settings.liveDataEnabled,
    stravaEnabled: settings.stravaEnabled,
  });
});
