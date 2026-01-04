import { config } from "./config.js";

const createSkeletonCard = () => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--activity";

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
    cover.className = "media-card__cover media-card__cover--activity";

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

const activityIconLabel = (type) => {
  const key = String(type || "").toLowerCase();
  if (key.includes("run")) return "R";
  if (key.includes("ride") || key.includes("bike")) return "B";
  if (key.includes("walk")) return "W";
  if (key.includes("hike")) return "H";
  if (key.includes("swim")) return "S";
  return "A";
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return "";
  const miles = meters / 1609.344;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const formatElevation = (meters) => {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  const feet = meters * 3.28084;
  return `${Math.round(feet)} ft`;
};

const createStat = (label, value) => {
  const stat = document.createElement("span");
  stat.className = "activity-stat";
  stat.textContent = `${value} ${label}`.trim();
  return stat;
};

const createActivityCard = (activity) => {
  const card = document.createElement("li");
  card.className = "media-card";

  const link = document.createElement("a");
  link.className = "media-card__link";
  link.href = activity.strava_url || "https://www.strava.com";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--activity";

  const icon = document.createElement("span");
  icon.className = "activity-icon";
  icon.textContent = activityIconLabel(activity.type);
  cover.append(icon);

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const title = document.createElement("div");
  title.className = "media-card__title";
  title.textContent = activity.name || "Untitled activity";

  const subtitle = document.createElement("div");
  subtitle.className = "media-card__subtitle";
  subtitle.textContent = [activity.type, formatDate(activity.start_date)]
    .filter(Boolean)
    .join(" - ");

  const stats = document.createElement("div");
  stats.className = "activity-stats";

  const distance = formatDistance(activity.distance_m);
  if (distance) stats.append(createStat("", distance));

  const duration = formatDuration(activity.moving_time_s);
  if (duration) stats.append(createStat("", duration));

  const elevation = formatElevation(activity.total_elevation_gain_m);
  if (elevation) stats.append(createStat("", elevation));

  meta.append(title, subtitle, stats);
  link.append(cover, meta);
  card.append(link);

  return card;
};

export const initStrava = async ({ liveDataEnabled = true, stravaEnabled = true } = {}) => {
  const section = document.querySelector("[data-strava-section]");
  const listEl = document.querySelector("[data-strava-list]");
  const statusEl = document.querySelector("[data-strava-status]");

  if (!listEl || !statusEl || !section) return;

  if (!config.strava?.enabled || !stravaEnabled) {
    section.hidden = true;
    return;
  }

  const limit = config.strava?.limit || 6;
  renderSkeleton(listEl, limit);

  if (!liveDataEnabled) {
    renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch workouts");
    statusEl.textContent = "Live data disabled.";
    return;
  }

  try {
    const response = await fetch(
      `/api/strava/recent?${new URLSearchParams({
        limit: String(limit),
      })}`
    );

    if (!response.ok) {
      throw new Error(`Strava error ${response.status}`);
    }

    const data = await response.json();
    const activities = data?.activities || [];

    if (!activities.length) {
      renderPlaceholder(listEl, limit, "No recent workouts", "Check Strava");
      statusEl.textContent = "No recent workouts found.";
      return;
    }

    const cards = activities.map((activity) => createActivityCard(activity));
    listEl.replaceChildren(...cards);
    statusEl.textContent = "Updated from Strava.";
  } catch (error) {
    section.hidden = true;
  }
};
