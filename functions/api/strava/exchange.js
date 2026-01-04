const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function onRequestGet({ request, env }) {
  if (String(env.STRAVA_EXCHANGE_ENABLED).toLowerCase() !== "true") {
    return new Response(JSON.stringify({ error: "Exchange disabled" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "Missing Strava credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return new Response(JSON.stringify({ error: "Token exchange failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseBody = {
    refresh_token: data.refresh_token,
    athlete_id: data.athlete?.id,
    expires_at: data.expires_at,
  };

  return new Response(JSON.stringify(responseBody), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
