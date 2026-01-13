import { initLastfm } from "./lastfm.js";
import { initYouTube } from "./youtube.js";
import { initBooks } from "./books.js";
import { initStrava } from "./strava.js";
import { config } from "./config.js";

// Request deduplication for settings API
let settingsPromise = null;

const getSettings = async () => {
  // Return existing promise if already fetching
  if (settingsPromise) {
    return settingsPromise;
  }

  const fallback = {
    liveDataEnabled: config.liveDataEnabled !== false,
    stravaEnabled: config.strava?.enabled !== false,
  };

  settingsPromise = (async () => {
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
  })();

  return settingsPromise;
};

// Intersection Observer for lazy-loading sections
const createSectionObserver = (callback) => {
  const options = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
  };

  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, options);
};

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSettings();

  // Set up lazy loading with Intersection Observer
  const observer = createSectionObserver(async (section) => {
    const sectionId = section.id;

    switch (sectionId) {
      case "now-playing":
        await initLastfm({ liveDataEnabled: settings.liveDataEnabled });
        break;
      case "videos":
        await initYouTube({ liveDataEnabled: settings.liveDataEnabled });
        break;
      case "books":
        await initBooks({ liveDataEnabled: settings.liveDataEnabled });
        break;
      case "workouts":
        await initStrava({
          liveDataEnabled: settings.liveDataEnabled,
          stravaEnabled: settings.stravaEnabled,
        });
        break;
    }
  });

  // Observe all media sections
  const sections = document.querySelectorAll(".media-section");
  sections.forEach((section) => observer.observe(section));
});
