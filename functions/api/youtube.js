import { checkEnvOrFail } from "../_shared/env-validation.js";

export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const requestedMaxResults = Number.parseInt(searchParams.get("maxResults") || "6", 10);
  const maxResults = String(
    Number.isFinite(requestedMaxResults) ? Math.min(Math.max(requestedMaxResults, 1), 50) : 6
  );
  const cache = caches.default;

  if (!channelId) {
    return new Response(JSON.stringify({ error: "Missing channelId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const envError = checkEnvOrFail(env, ["YOUTUBE_API_KEY"]);
  if (envError) return envError;

  const cacheUrl = new URL("/api/youtube", new URL(request.url).origin);
  cacheUrl.search = new URLSearchParams({
    channelId,
    maxResults,
    source: "uploads-v1",
  });
  const cacheKey = new Request(cacheUrl);

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // The search endpoint can omit or misorder recent uploads. Resolve the
  // channel's canonical uploads playlist instead, which matches the Videos tab.
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.search = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    id: channelId,
    part: "contentDetails",
  });

  const channelResponse = await fetch(channelUrl.toString());
  const channelData = await channelResponse.json();

  if (!channelResponse.ok) {
    return new Response(JSON.stringify(channelData), {
      status: channelResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    return new Response(JSON.stringify({ items: [], durationsById: {} }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.search = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    playlistId: uploadsPlaylistId,
    part: "contentDetails",
    maxResults,
  });

  const playlistResponse = await fetch(playlistUrl.toString());
  const playlistData = await playlistResponse.json();

  if (!playlistResponse.ok) {
    return new Response(JSON.stringify(playlistData), {
      status: playlistResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const videoIds = (playlistData.items || [])
    .map((item) => item.contentDetails?.videoId)
    .filter(Boolean);

  let items = [];
  let durationsById = {};
  if (videoIds.length) {
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.search = new URLSearchParams({
      key: env.YOUTUBE_API_KEY,
      id: videoIds.join(","),
      part: "snippet,contentDetails",
    });

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok) {
      return new Response(JSON.stringify(detailsData), {
        status: detailsResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const detailsById = new Map((detailsData.items || []).map((item) => [item.id, item]));
    items = videoIds
      .map((id) => detailsById.get(id))
      .filter(Boolean)
      .map((item) => ({ id: { videoId: item.id }, snippet: item.snippet }));
    durationsById = Object.fromEntries(
      (detailsData.items || []).map((item) => [item.id, item.contentDetails?.duration || ""])
    );
  }

  const response = new Response(JSON.stringify({ items, durationsById }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
