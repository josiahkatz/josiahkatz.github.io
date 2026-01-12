const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

const buildStateCookie = (state, isSecure) => {
  const parts = [
    `decap_state=${state}`,
    "Path=/auth/callback",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=300",
  ];
  if (isSecure) {
    parts.push("Secure");
  }
  return parts.join("; ");
};

export async function onRequestGet({ request, env }) {
  const debugEnabled = String(env.AUTH_DEBUG).toLowerCase() === "true";
  const log = (...args) => {
    if (debugEnabled) console.log("[auth]", ...args);
  };

  if (!env.GITHUB_CLIENT_ID) {
    log("Missing GITHUB_CLIENT_ID");
    return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/auth/callback`;
  const scope = url.searchParams.get("scope") || "public_repo";
  log("Requested scope", scope);
  log("Init auth", { origin, redirectUri });

  const authUrl = new URL(GITHUB_AUTHORIZE_URL);
  authUrl.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const headers = new Headers({
    Location: authUrl.toString(),
  });

  headers.set(
    "Set-Cookie",
    buildStateCookie(state, url.protocol === "https:")
  );

  return new Response(null, { status: 302, headers });
}
