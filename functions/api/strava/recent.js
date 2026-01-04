const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";
const MAX_LIMIT = 10;

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
};

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 6;
  return Math.min(parsed, MAX_LIMIT);
};

const sanitizeActivity = (activity) => ({
  id: activity.id,
  name: activity.name || "Untitled activity",
  type: activity.type,
  start_date: activity.start_date,
  distance_m: Number.isFinite(activity.distance) ? activity.distance : 0,
  moving_time_s: Number.isFinite(activity.moving_time) ? activity.moving_time : 0,
  elapsed_time_s: Number.isFinite(activity.elapsed_time) ? activity.elapsed_time : 0,
  total_elevation_gain_m: Number.isFinite(activity.total_elevation_gain)
    ? activity.total_elevation_gain
    : 0,
  strava_url: activity.id
    ? `https://www.strava.com/activities/${activity.id}`
    : "https://www.strava.com",
});

const missingEnv = (env) =>
  !env.STRAVA_CLIENT_ID ||
  !env.STRAVA_CLIENT_SECRET ||
  !env.STRAVA_REFRESH_TOKEN;

export async function onRequestGet({ request, env }) {
  const liveDataEnabled = parseBoolean(env.LIVE_DATA_ENABLED, true);
  const stravaEnabled = parseBoolean(env.STRAVA_ENABLED, true);

  if (!liveDataEnabled || !stravaEnabled) {
    return new Response(JSON.stringify({ activities: [] }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  if (missingEnv(env)) {
    return new Response(JSON.stringify({ error: "Missing Strava credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/strava/recent?limit=${limit}`);

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: env.STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData?.access_token;

  if (!tokenResponse.ok || !accessToken) {
    return new Response(JSON.stringify({ error: "Failed to refresh Strava token" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const activitiesUrl = new URL(STRAVA_ACTIVITIES_URL);
  activitiesUrl.search = new URLSearchParams({
    per_page: String(limit),
  });

  const activitiesResponse = await fetch(activitiesUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const activitiesData = await activitiesResponse.json();

  if (!activitiesResponse.ok || !Array.isArray(activitiesData)) {
    return new Response(JSON.stringify({ error: "Failed to load Strava activities" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sanitized = activitiesData.map(sanitizeActivity);

  const response = new Response(JSON.stringify({ activities: sanitized }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, s-maxage=1800",
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
