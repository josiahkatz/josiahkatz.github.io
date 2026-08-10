import { checkEnvOrFail } from "../_shared/env-validation.js";

export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const edition = searchParams.get("edition") || "";
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

  if (edition && !/^OL\d+M$/.test(edition)) {
    return new Response(JSON.stringify({ error: "Invalid Open Library edition" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const envError = checkEnvOrFail(env, ["GOOGLE_BOOKS_API_KEY"]);
  if (envError) return envError;

  const cacheUrl = new URL("/api/books", new URL(request.url).origin);
  cacheUrl.search = new URLSearchParams({
    q: query,
    ...(edition ? { edition } : {}),
  });
  const cacheKey = new Request(cacheUrl);

  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  let isbn = "";

  if (edition) {
    try {
      const editionResponse = await fetch(`https://openlibrary.org/books/${edition}.json`);
      if (editionResponse.ok) {
        const editionData = await editionResponse.json();
        isbn = editionData.isbn_13?.[0] || editionData.isbn_10?.[0] || "";
      }
    } catch {
      // Fall back to validated title and author matching below.
    }
  }

  const fetchGoogleBooks = (googleQuery) => {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.search = new URLSearchParams({
      q: googleQuery,
      key: env.GOOGLE_BOOKS_API_KEY,
      maxResults: "5",
      printType: "books",
    });
    return fetch(url.toString());
  };

  let matchType = isbn ? "isbn" : "metadata";
  let upstreamResponse = await fetchGoogleBooks(isbn ? `isbn:${isbn}` : query);
  let data = await upstreamResponse.json();

  if (isbn && upstreamResponse.ok && !data.items?.length) {
    matchType = "metadata";
    upstreamResponse = await fetchGoogleBooks(query);
    data = await upstreamResponse.json();
  }

  data.matchType = matchType;

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
