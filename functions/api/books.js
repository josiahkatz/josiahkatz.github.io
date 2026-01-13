import { checkEnvOrFail } from "../_shared/env-validation.js";

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

  const envError = checkEnvOrFail(env, ["GOOGLE_BOOKS_API_KEY"]);
  if (envError) return envError;

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

  const upstreamResponse = await fetch(url.toString());
  const data = await upstreamResponse.json();

  const response = new Response(JSON.stringify(data), {
    status: upstreamResponse.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=172800",
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
