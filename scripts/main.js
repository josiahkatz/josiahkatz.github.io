import { config } from "./config.js";
import { initLastfm } from "./lastfm.js";
import { initYouTube } from "./youtube.js";
import { initBooks } from "./books.js";

const getLiveDataEnabled = async () => {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (typeof data.liveDataEnabled === "boolean") {
        return data.liveDataEnabled;
      }
    }
  } catch (error) {
    // Settings endpoint not available.
  }

  return config.liveDataEnabled !== false;
};

document.addEventListener("DOMContentLoaded", async () => {
  const liveDataEnabled = await getLiveDataEnabled();
  initLastfm({ liveDataEnabled });
  initYouTube({ liveDataEnabled });
  initBooks({ liveDataEnabled });
});
