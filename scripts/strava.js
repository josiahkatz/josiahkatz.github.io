import { config } from "./config.js";
import {
  renderSkeleton,
  renderPlaceholder,
  createMediaCard,
  finishLoading,
} from "./utils/cards.js";
import { fetchWithRetry, formatTimestamp } from "./utils/fetch.js";

// Mock data for development
const MOCK_WORKOUTS = [
  {
    id: 1,
    name: "Morning Weight Training",
    type: "Weight Training",
    start_date: "2026-01-17T07:30:00Z",
    distance_m: 0,
    moving_time_s: 1617, // 26:57
    elapsed_time_s: 1617,
    total_elevation_gain_m: 0,
    strava_url: "https://www.strava.com/activities/1"
  },
  {
    id: 2,
    name: "Lunch Run",
    type: "Run",
    start_date: "2026-01-17T12:00:00Z",
    distance_m: 4844, // ~3.01 miles
    moving_time_s: 1513, // 25:13
    elapsed_time_s: 1513,
    total_elevation_gain_m: 45,
    strava_url: "https://www.strava.com/activities/2"
  },
  {
    id: 3,
    name: "Evening Walk",
    type: "Walk",
    start_date: "2026-01-16T18:30:00Z",
    distance_m: 3218, // ~2 miles
    moving_time_s: 2100, // 35:00
    elapsed_time_s: 2100,
    total_elevation_gain_m: 15,
    strava_url: "https://www.strava.com/activities/3"
  },
  {
    id: 4,
    name: "Mountain Hike",
    type: "Hike",
    start_date: "2026-01-15T09:00:00Z",
    distance_m: 8046, // ~5 miles
    moving_time_s: 7200, // 2:00:00
    elapsed_time_s: 7200,
    total_elevation_gain_m: 450,
    strava_url: "https://www.strava.com/activities/4"
  },
  {
    id: 5,
    name: "Recovery Ride",
    type: "Ride",
    start_date: "2026-01-14T16:00:00Z",
    distance_m: 16093, // ~10 miles
    moving_time_s: 2400, // 40:00
    elapsed_time_s: 2400,
    total_elevation_gain_m: 120,
    strava_url: "https://www.strava.com/activities/5"
  },
  {
    id: 6,
    name: "Core Workout",
    type: "Weight Training",
    start_date: "2026-01-13T07:00:00Z",
    distance_m: 0,
    moving_time_s: 1800, // 30:00
    elapsed_time_s: 1800,
    total_elevation_gain_m: 0,
    strava_url: "https://www.strava.com/activities/6"
  }
];

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
  return miles.toFixed(2);
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
  // Determine if this is a distance-based or time-based workout
  const hasDistance = activity.distance_m > 0;

  // Create the cover content with just the badge
  const badge = document.createElement("span");
  badge.className = "media-card__badge";
  badge.textContent = activity.type || "Activity";

  // Create main metric display for meta section
  const metricContainer = document.createElement("div");
  metricContainer.className = "workout-metric";

  const metricValue = document.createElement("span");
  metricValue.className = "workout-metric__value";

  const metricUnit = document.createElement("span");
  metricUnit.className = "workout-metric__unit";

  if (hasDistance) {
    // Show distance as main metric
    metricValue.textContent = formatDistance(activity.distance_m);
    metricUnit.textContent = "miles";
  } else {
    // Show time as main metric
    metricValue.textContent = formatDuration(activity.moving_time_s);
    metricUnit.textContent = "time";
  }

  metricContainer.append(metricValue, metricUnit);

  // Build subtitle
  let subtitle = formatDate(activity.start_date);
  if (hasDistance) {
    // For distance workouts, add time to subtitle
    const duration = formatDuration(activity.moving_time_s);
    if (duration) {
      subtitle += ` - ${duration} minutes`;
    }
  }

  // Create wrapper for meta content
  const metaWrapper = document.createElement("div");
  metaWrapper.className = "workout-meta-wrapper";

  const titleEl = document.createElement("div");
  titleEl.className = "media-card__title";
  titleEl.textContent = activity.name || "Untitled activity";

  const subtitleEl = document.createElement("div");
  subtitleEl.className = "media-card__subtitle";
  subtitleEl.textContent = subtitle;

  metaWrapper.append(metricContainer, titleEl, subtitleEl);

  return createMediaCard({
    href: activity.strava_url || "https://www.strava.com",
    customCoverContent: badge,
    coverClass: "media-card__cover--activity",
    additionalContent: metaWrapper,
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

export const initStrava = async ({ liveDataEnabled = true, stravaEnabled = true, useMockData = true, skeletonDelay = 0 } = {}) => {
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
    renderSkeleton(listEl, limit, "activity");
    updateStatus(statusEl, "");

    if (skeletonDelay > 0) {
      await new Promise((r) => setTimeout(r, skeletonDelay));
    }

    // If using mock data, skip live data check
    if (!useMockData && !liveDataEnabled) {
      renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch workouts");
      updateStatus(statusEl, "");
      return;
    }

    try {
      let activities;

      if (useMockData) {
        // Use mock data for development
        activities = MOCK_WORKOUTS.slice(0, limit);
        updateStatus(statusEl, "");
      } else {
        // Fetch from Strava API
        const data = await fetchStravaData(limit);
        activities = data?.activities || [];
        updateStatus(statusEl, "");
      }

      if (!activities.length) {
        renderPlaceholder(listEl, limit, "No recent workouts", "Check Strava");
        updateStatus(statusEl, "", null, loadData);
        return;
      }

      const cards = activities.map((activity) => createActivityCard(activity));
      listEl.replaceChildren(...cards);
      finishLoading(listEl);
    } catch (error) {
      renderPlaceholder(listEl, limit, "Strava unavailable", "Try again later");
      updateStatus(statusEl, "Retry", null, loadData);
    }
  };

  await loadData();
};
