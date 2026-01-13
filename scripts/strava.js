import { config } from "./config.js";
import {
  renderSkeleton,
  renderPlaceholder,
  createMediaCard,
  finishLoading,
} from "./utils/cards.js";
import { fetchWithRetry, formatTimestamp } from "./utils/fetch.js";

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

const createActivityCard = (activity) => {
  const icon = document.createElement("span");
  icon.className = "activity-icon";
  icon.textContent = activityIconLabel(activity.type);

  const stats = document.createElement("div");
  stats.className = "activity-stats";

  const distance = formatDistance(activity.distance_m);
  if (distance) stats.append(createStat("", distance));

  const duration = formatDuration(activity.moving_time_s);
  if (duration) stats.append(createStat("", duration));

  const elevation = formatElevation(activity.total_elevation_gain_m);
  if (elevation) stats.append(createStat("", elevation));

  return createMediaCard({
    href: activity.strava_url || "https://www.strava.com",
    customCoverContent: icon,
    coverClass: "media-card__cover--activity",
    title: activity.name || "Untitled activity",
    subtitle: [activity.type, formatDate(activity.start_date)]
      .filter(Boolean)
      .join(" - "),
    additionalContent: stats,
  });
};

const fetchStravaData = async (limit) => {
  const response = await fetchWithRetry(
    `/api/strava/recent?${new URLSearchParams({
      limit: String(limit),
    })}`
  );

  if (!response.ok) {
    throw new Error(`Strava error ${response.status}`);
  }

  return response.json();
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

  const loadData = async () => {
    renderSkeleton(listEl, limit);
    updateStatus(statusEl, "Loading Strava activity.");

    if (!liveDataEnabled) {
      renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch workouts");
      updateStatus(statusEl, "Live data disabled.");
      return;
    }

    try {
      const data = await fetchStravaData(limit);
      const activities = data?.activities || [];

      if (!activities.length) {
        renderPlaceholder(listEl, limit, "No recent workouts", "Check Strava");
        updateStatus(statusEl, "No recent workouts found.", new Date(), loadData);
        return;
      }

      const cards = activities.map((activity) => createActivityCard(activity));
      listEl.replaceChildren(...cards);
      finishLoading(listEl);
      updateStatus(statusEl, "Updated from Strava", new Date());
    } catch (error) {
      renderPlaceholder(listEl, limit, "Strava unavailable", "Try again later");
      updateStatus(statusEl, "Could not load Strava activities.", null, loadData);
    }
  };

  await loadData();
};
