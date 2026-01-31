import { config } from "./config.js";
import {
  renderSkeleton,
  renderPlaceholder,
  createMediaCard,
  finishLoading,
} from "./utils/cards.js";
import { fetchWithRetry, formatTimestamp } from "./utils/fetch.js";

const LASTFM_ROOT = "https://ws.audioscrobbler.com/2.0/";

const getTrackImage = (track) => {
  const images = track?.image || [];
  const picked =
    images.find((image) => image.size === "extralarge") ||
    images.find((image) => image.size === "large") ||
    images[images.length - 1];

  return picked && picked["#text"] ? picked["#text"] : "";
};

const normalizeItunesArtwork = (url) => {
  if (!url) return "";
  const upgraded = url.replace(/100x100bb\.jpg$/, "600x600bb.jpg");
  return upgraded.replace(/^http:/, "https:");
};

const fetchItunesArtwork = async (title, artist) => {
  if (!title || !artist) return "";

  const url = new URL("https://itunes.apple.com/search");
  url.search = new URLSearchParams({
    term: `${title} ${artist}`,
    media: "music",
    entity: "song",
    limit: "1",
  });

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) {
    throw new Error(`iTunes error ${response.status}`);
  }

  const data = await response.json();
  const item = data.results?.[0];
  return normalizeItunesArtwork(item?.artworkUrl100 || "");
};

const resolveTrackCover = async (track) => {
  const title = track?.name || "";
  const artist = getTrackArtist(track);
  const lastfmCover = getTrackImage(track);

  try {
    const itunesCover = await fetchItunesArtwork(title, artist);
    return itunesCover || lastfmCover;
  } catch (error) {
    return lastfmCover;
  }
};

const getTrackArtist = (track) => {
  if (!track) return "";
  if (typeof track.artist === "string") return track.artist;
  return track.artist?.["#text"] || track.artist?.name || "";
};

const updateStatus = (statusEl, message, timestamp = null, onRetry = null) => {
  if (!statusEl) return;

  statusEl.innerHTML = "";
  statusEl.textContent = message;

  if (timestamp) {
    const timeEl = document.createElement("span");
    timeEl.className = "section-timestamp";
    timeEl.textContent = `(${formatTimestamp(timestamp)})`;
    statusEl.append(timeEl);
  }

  if (onRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-button";
    retryBtn.textContent = "Retry";
    retryBtn.onclick = onRetry;
    statusEl.append(" ", retryBtn);
  }
};

const fetchLastfmData = async (limit) => {
  const url = new URL(LASTFM_ROOT);
  url.search = new URLSearchParams({
    method: "user.getrecenttracks",
    user: config.lastfm.user,
    api_key: config.lastfm.apiKey,
    format: "json",
    limit: String(limit),
  });

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) {
    throw new Error(`Last.fm error ${response.status}`);
  }

  return response.json();
};

export const initLastfm = async ({ liveDataEnabled = true, skeletonDelay = 0 } = {}) => {
  const listEl = document.querySelector("[data-lastfm-list]");
  const statusEl = document.querySelector("[data-lastfm-status]");

  if (!listEl || !statusEl) return;

  const limit = config.lastfm.limit || 6;

  const loadData = async () => {
    renderSkeleton(listEl, limit);
    updateStatus(statusEl, "");

    if (skeletonDelay > 0) {
      await new Promise((r) => setTimeout(r, skeletonDelay));
    }

    if (!liveDataEnabled) {
      renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch tracks");
      updateStatus(statusEl, "");
      return;
    }

    if (!config.lastfm.apiKey) {
      renderPlaceholder(listEl, limit, "Add Last.fm API key", "scripts/config.js");
      updateStatus(statusEl, "");
      return;
    }

    try {
      const data = await fetchLastfmData(limit);
      const tracks = data?.recenttracks?.track || [];

      if (!tracks.length) {
        renderPlaceholder(listEl, limit, "No recent tracks", "Check Last.fm profile");
        updateStatus(statusEl, "", null, loadData);
        return;
      }

      const selected = tracks.slice(0, limit);
      const covers = await Promise.all(
        selected.map((track) => resolveTrackCover(track))
      );

      const cards = selected.map((track, index) =>
        createMediaCard({
          href: track.url || "https://www.last.fm/user/" + config.lastfm.user,
          coverUrl: covers[index],
          coverAlt: track.name ? `${track.name} album art` : "Album art",
          title: track.name || "Untitled track",
          subtitle: getTrackArtist(track) || "Unknown artist",
          badge:
            track?.["@attr"]?.nowplaying === "true" ? "Now playing" : null,
        })
      );

      listEl.replaceChildren(...cards);
      finishLoading(listEl);
      updateStatus(statusEl, "");
    } catch (error) {
      renderPlaceholder(listEl, limit, "Last.fm unavailable", "Try again later");
      updateStatus(statusEl, "Retry", null, loadData);
    }
  };

  await loadData();
};
