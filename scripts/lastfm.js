import { config } from "./config.js";

const LASTFM_ROOT = "https://ws.audioscrobbler.com/2.0/";

const createSkeletonCard = () => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover";

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
    cover.className = "media-card__cover";

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

  const response = await fetch(url.toString());
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

const createTrackCard = (track, coverUrl) => {
  const card = document.createElement("li");
  card.className = "media-card";

  const link = document.createElement("a");
  link.className = "media-card__link";
  link.href = track.url || "https://www.last.fm/user/" + config.lastfm.user;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const cover = document.createElement("div");
  cover.className = "media-card__cover";

  if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = track.name ? `${track.name} album art` : "Album art";
    img.loading = "lazy";
    cover.append(img);
  }

  const nowPlaying = track?.["@attr"]?.nowplaying === "true";
  if (nowPlaying) {
    const badge = document.createElement("span");
    badge.className = "media-card__badge";
    badge.textContent = "Now playing";
    cover.append(badge);
  }

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const title = document.createElement("div");
  title.className = "media-card__title";
  title.textContent = track.name || "Untitled track";

  const subtitle = document.createElement("div");
  subtitle.className = "media-card__subtitle";
  subtitle.textContent = getTrackArtist(track) || "Unknown artist";

  meta.append(title, subtitle);
  link.append(cover, meta);
  card.append(link);

  return card;
};

export const initLastfm = async ({ liveDataEnabled = true } = {}) => {
  const listEl = document.querySelector("[data-lastfm-list]");
  const statusEl = document.querySelector("[data-lastfm-status]");

  if (!listEl || !statusEl) return;

  const limit = config.lastfm.limit || 6;
  renderSkeleton(listEl, limit);

  if (!liveDataEnabled) {
    renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch tracks");
    statusEl.textContent = "Live data disabled.";
    return;
  }

  if (!config.lastfm.apiKey) {
    renderPlaceholder(listEl, limit, "Add Last.fm API key", "scripts/config.js");
    statusEl.textContent = "Add your Last.fm API key in scripts/config.js.";
    return;
  }

  const url = new URL(LASTFM_ROOT);
  url.search = new URLSearchParams({
    method: "user.getrecenttracks",
    user: config.lastfm.user,
    api_key: config.lastfm.apiKey,
    format: "json",
    limit: String(limit),
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Last.fm error ${response.status}`);
    }

    const data = await response.json();
    const tracks = data?.recenttracks?.track || [];

    if (!tracks.length) {
      statusEl.textContent = "No recent tracks found.";
      renderPlaceholder(listEl, limit, "No recent tracks", "Check Last.fm profile");
      return;
    }

    const selected = tracks.slice(0, limit);
    const covers = await Promise.all(
      selected.map((track) => resolveTrackCover(track))
    );
    const cards = selected.map((track, index) =>
      createTrackCard(track, covers[index])
    );
    listEl.replaceChildren(...cards);
    statusEl.textContent = "Updated from Last.fm";
  } catch (error) {
    statusEl.textContent = "Could not load Last.fm tracks.";
    renderPlaceholder(listEl, limit, "Last.fm unavailable", "Try again later");
  }
};
