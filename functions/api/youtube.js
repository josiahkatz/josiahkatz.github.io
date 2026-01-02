export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const maxResults = searchParams.get("maxResults") || "6";
  const cache = caches.default;

  if (!channelId) {
    return new Response(
      JSON.stringify({ error: "Missing channelId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!env.YOUTUBE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const cacheKey = new Request(
    `${new URL(request.url).origin}/api/youtube?channelId=${channelId}&maxResults=${maxResults}`
  );

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.search = new URLSearchParams({
    key: env.YOUTUBE_API_KEY,
    channelId,
    part: "snippet",
    order: "date",
    maxResults,
    type: "video",
  });

  const searchResponse = await fetch(searchUrl.toString());
  const searchData = await searchResponse.json();

  if (!searchResponse.ok) {
    return new Response(JSON.stringify(searchData), {
      status: searchResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ids = (searchData.items || [])
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  let durationsById = {};
  if (ids) {
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.search = new URLSearchParams({
      key: env.YOUTUBE_API_KEY,
      id: ids,
      part: "contentDetails",
    });

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (detailsResponse.ok) {
      durationsById = Object.fromEntries(
        (detailsData.items || []).map((item) => [
          item.id,
          item.contentDetails?.duration || "",
        ])
      );
    }
  }

  const response = new Response(
    JSON.stringify({ items: searchData.items || [], durationsById }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-maxage=600",
      },
    }
  );

  await cache.put(cacheKey, response.clone());
  return response;
}
