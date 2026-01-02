import { initLastfm } from "./lastfm.js";
import { initYouTube } from "./youtube.js";
import { initBooks } from "./books.js";

const LIVE_RELOAD_KEY = "livereload-active";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const setLiveReloadState = (value) => {
  try {
    window.localStorage.setItem(LIVE_RELOAD_KEY, value ? "true" : "false");
  } catch (error) {
    // Ignore storage errors.
  }
};

const checkLiveReload = async () => {
  if (!LOCAL_HOSTS.has(window.location.hostname)) {
    setLiveReloadState(false);
    return;
  }

  try {
    const response = await fetch("/__livereload-check", { cache: "no-store" });
    setLiveReloadState(response.ok);
  } catch (error) {
    setLiveReloadState(false);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkLiveReload();
  initLastfm();
  initYouTube();
  initBooks();
});
