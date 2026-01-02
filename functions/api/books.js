export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const cache = caches.default;

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing query" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!env.GOOGLE_BOOKS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing GOOGLE_BOOKS_API_KEY" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const cacheKey = new Request(
    `${new URL(request.url).origin}/api/books?q=${encodeURIComponent(query)}`
  );

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.search = new URLSearchParams({
    q: query,
    key: env.GOOGLE_BOOKS_API_KEY,
    maxResults: "1",
    printType: "books",
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  const response = new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
