import { config } from "./config.js";

const createSkeletonCard = () => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--wide";

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const line1 = document.createElement("div");
  line1.className = "skeleton-line";

  const line2 = document.createElement("div");
  line2.className = "skeleton-line skeleton-line--short";

  meta.append(line1, line2);
  card.append(cover, meta);

  return card;
};

const renderSkeleton = (listEl, count) => {
  const cards = Array.from({ length: count }, () => createSkeletonCard());
  listEl.replaceChildren(...cards);
};

const renderPlaceholder = (listEl, count, title, subtitle) => {
  const cards = Array.from({ length: count }, () => {
    const card = document.createElement("li");
    card.className = "media-card media-card--placeholder";

    const cover = document.createElement("div");
    cover.className = "media-card__cover media-card__cover--wide";

    const meta = document.createElement("div");
    meta.className = "media-card__meta";

    const titleEl = document.createElement("div");
    titleEl.className = "media-card__title";
    titleEl.textContent = title;

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "media-card__subtitle";
    subtitleEl.textContent = subtitle;

    meta.append(titleEl, subtitleEl);
    card.append(cover, meta);

    return card;
  });

  listEl.replaceChildren(...cards);
};

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

const createVideoCard = (video, duration) => {
  const snippet = video.snippet || {};
  const videoId = video.id?.videoId;
  const titleText = decodeHtml(snippet.title) || "Untitled video";

  const card = document.createElement("li");
  card.className = "media-card";

  const link = document.createElement("a");
  link.className = "media-card__link";
  link.href = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/channel/${config.youtube.channelId}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--wide";

  const imageUrl =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url ||
    "";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `${titleText} thumbnail`;
    img.loading = "lazy";
    cover.append(img);
  }

  if (duration) {
    const badge = document.createElement("span");
    badge.className = "media-card__badge";
    badge.textContent = duration;
    cover.append(badge);
  }

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const title = document.createElement("div");
  title.className = "media-card__title";
  title.textContent = titleText;

  const subtitle = document.createElement("div");
  subtitle.className = "media-card__subtitle";
  subtitle.textContent = formatVideoDate(snippet.publishedAt) || "";

  meta.append(title, subtitle);
  link.append(cover, meta);
  card.append(link);

  return card;
};

const renderVideos = (listEl, items, durationsById, limit) => {
  const trimmed = Number.isFinite(limit) ? items.slice(0, limit) : items;
  const cards = trimmed.map((video) =>
    createVideoCard(video, durationsById[video.id?.videoId] || "")
  );
  listEl.replaceChildren(...cards);
};

export const initYouTube = async ({ liveDataEnabled = true } = {}) => {
  const listEl = document.querySelector("[data-youtube-list]");
  const statusEl = document.querySelector("[data-youtube-status]");

  if (!listEl || !statusEl) return;

  const limit = config.youtube.maxResults || 6;
  renderSkeleton(listEl, limit);

  if (!config.youtube.channelId) {
    renderPlaceholder(listEl, limit, "Add YouTube channel ID", "scripts/config.js");
    statusEl.textContent = "Add your YouTube channel ID in scripts/config.js.";
    return;
  }

  const cacheKey = `youtube-cache:${config.youtube.channelId}:${limit}`;
  const cached = readCache(cacheKey);
  if (!liveDataEnabled) {
    if (cached?.payload?.items?.length) {
      renderVideos(
        listEl,
        cached.payload.items,
        cached.payload.durationsById,
        limit
      );
      statusEl.textContent = "Live data off. Showing cached videos.";
    } else {
      renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch videos");
      statusEl.textContent = "Live data disabled.";
    }
    return;
  }

  if (cached?.isFresh) {
    renderVideos(
      listEl,
      cached.payload.items,
      cached.payload.durationsById,
      limit
    );
    statusEl.textContent = "Showing cached YouTube videos.";
    return;
  }

  const url = `/api/youtube?${new URLSearchParams({
    channelId: config.youtube.channelId,
    maxResults: String(limit),
  })}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube error ${response.status}`);
    }

    const data = await response.json();
    const items = data?.items || [];
    const durationsById = data?.durationsById || {};

    if (!items.length) {
      statusEl.textContent = "No recent videos found.";
      renderPlaceholder(listEl, limit, "No videos found", "Check channel ID");
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
    statusEl.textContent = "Updated from YouTube.";
  } catch (error) {
    if (cached?.payload?.items?.length) {
      renderVideos(
        listEl,
        cached.payload.items,
        cached.payload.durationsById,
        limit
      );
      statusEl.textContent =
        "Showing cached YouTube videos (API unavailable).";
      return;
    }

    statusEl.textContent = "Could not load YouTube videos.";
    renderPlaceholder(listEl, limit, "YouTube unavailable", "Try again later");
  }
};
