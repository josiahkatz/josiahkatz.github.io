const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
};

export async function onRequestGet({ env }) {
  const liveDataEnabled = parseBoolean(env.LIVE_DATA_ENABLED, true);
  const stravaEnabled = parseBoolean(env.STRAVA_ENABLED, true);

  return new Response(JSON.stringify({ liveDataEnabled, stravaEnabled }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
