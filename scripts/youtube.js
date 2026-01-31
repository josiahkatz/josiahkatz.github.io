import { config } from "./config.js";
import {
  renderSkeleton,
  renderPlaceholder,
  createMediaCard,
  finishLoading,
} from "./utils/cards.js";
import { fetchWithRetry, formatTimestamp } from "./utils/fetch.js";

const CACHE_TTL_MS = 15 * 60 * 1000;

const formatVideoDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const decodeHtml = (value) => {
  if (!value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return doc.documentElement.textContent || "";
};

const readCache = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp || !parsed.payload) return null;
    const age = Date.now() - parsed.timestamp;
    return { payload: parsed.payload, isFresh: age < CACHE_TTL_MS };
  } catch (error) {
    return null;
  }
};

const writeCache = (key, payload) => {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), payload })
    );
  } catch (error) {
    // Ignore cache errors.
  }
};

const formatDuration = (value) => {
  if (!value) return "";
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  const parts = [];
  if (hours > 0) parts.push(String(hours));
  parts.push(String(hours > 0 ? String(minutes).padStart(2, "0") : minutes));
  parts.push(String(String(seconds).padStart(2, "0")));

  return parts.join(":");
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

const createVideoCard = (video, duration) => {
  const snippet = video.snippet || {};
  const videoId = video.id?.videoId;
  const titleText = decodeHtml(snippet.title) || "Untitled video";

  const imageUrl =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url ||
    "";

  return createMediaCard({
    href: videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/channel/${config.youtube.channelId}`,
    coverUrl: imageUrl,
    coverAlt: `${titleText} thumbnail`,
    coverClass: "media-card__cover--wide",
    title: titleText,
    subtitle: formatVideoDate(snippet.publishedAt) || "",
    badge: duration || null,
  });
};

const renderVideos = (listEl, items, durationsById, limit) => {
  const trimmed = Number.isFinite(limit) ? items.slice(0, limit) : items;
  const cards = trimmed.map((video) =>
    createVideoCard(video, durationsById[video.id?.videoId] || "")
  );
  listEl.replaceChildren(...cards);
  finishLoading(listEl);
};

const fetchYouTubeData = async (limit) => {
  const url = `/api/youtube?${new URLSearchParams({
    channelId: config.youtube.channelId,
    maxResults: String(limit),
  })}`;

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`YouTube error ${response.status}`);
  }

  return response.json();
};

export const initYouTube = async ({ liveDataEnabled = true, skeletonDelay = 0 } = {}) => {
  const listEl = document.querySelector("[data-youtube-list]");
  const statusEl = document.querySelector("[data-youtube-status]");

  if (!listEl || !statusEl) return;

  const limit = config.youtube.maxResults || 6;

  const loadData = async () => {
    renderSkeleton(listEl, limit, "video");
    updateStatus(statusEl, "");

    if (skeletonDelay > 0) {
      await new Promise((r) => setTimeout(r, skeletonDelay));
    }

    if (!liveDataEnabled) {
      const cacheKey = `youtube-cache:${config.youtube.channelId}:${limit}`;
      const cached = readCache(cacheKey);
      if (cached?.payload?.items?.length) {
        renderVideos(
          listEl,
          cached.payload.items,
          cached.payload.durationsById,
          limit
        );
        updateStatus(statusEl, "");
      } else {
        renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch videos");
        updateStatus(statusEl, "");
      }
      return;
    }

    if (!config.youtube.channelId) {
      renderPlaceholder(listEl, limit, "Add YouTube channel ID", "scripts/config.js");
      updateStatus(statusEl, "");
      return;
    }

    const cacheKey = `youtube-cache:${config.youtube.channelId}:${limit}`;
    const cached = readCache(cacheKey);

    if (cached?.isFresh) {
      renderVideos(
        listEl,
        cached.payload.items,
        cached.payload.durationsById,
        limit
      );
      updateStatus(statusEl, "");
      return;
    }

    try {
      const data = await fetchYouTubeData(limit);
      const items = data?.items || [];
      const durationsById = data?.durationsById || {};

      if (!items.length) {
        renderPlaceholder(listEl, limit, "No videos found", "Check channel ID");
        updateStatus(statusEl, "", null, loadData);
        return;
      }

      const formattedDurationsById = Object.fromEntries(
        Object.entries(durationsById).map(([id, duration]) => [
          id,
          formatDuration(duration),
        ])
      );

      renderVideos(listEl, items, formattedDurationsById, limit);
      writeCache(cacheKey, { items, durationsById: formattedDurationsById });
      updateStatus(statusEl, "");
    } catch (error) {
      if (cached?.payload?.items?.length) {
        renderVideos(
          listEl,
          cached.payload.items,
          cached.payload.durationsById,
          limit
        );
        updateStatus(statusEl, "Retry", null, loadData);
        return;
      }

      renderPlaceholder(listEl, limit, "YouTube unavailable", "Try again later");
      updateStatus(statusEl, "Retry", null, loadData);
    }
  };

  await loadData();
};
