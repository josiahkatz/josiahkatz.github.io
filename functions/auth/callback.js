const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = rest.join("=");
    return acc;
  }, {});

const buildHtmlResponse = (payload, isSuccess) => {
  const payloadJson = JSON.stringify(payload)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authentication ${isSuccess ? "Complete" : "Failed"}</title>
  </head>
  <body>
    <script>
      (function () {
        var message = 'authorization:github:${isSuccess ? "success" : "error"}:' + '${payloadJson}';
        if (window.opener) {
          window.opener.postMessage(message, '*');
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
};

export async function onRequestGet({ request, env }) {
  const debugEnabled = String(env.AUTH_DEBUG).toLowerCase() === "true";
  const log = (...args) => {
    if (debugEnabled) console.log("[auth:callback]", ...args);
  };

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    log("Missing OAuth env vars", {
      hasClientId: Boolean(env.GITHUB_CLIENT_ID),
      hasClientSecret: Boolean(env.GITHUB_CLIENT_SECRET),
    });
    return new Response("Missing GitHub OAuth credentials", { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const expectedState = cookies.decap_state;
  log("Callback hit", {
    hasCode: Boolean(code),
    state: state ? state.slice(0, 8) : null,
    expectedState: expectedState ? expectedState.slice(0, 8) : null,
    origin: url.origin,
  });

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  if (expectedState && state !== expectedState) {
    log("State mismatch", { state, expectedState });
    return new Response("Invalid state", { status: 400 });
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/auth/callback`,
      state: state || "",
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  log("Token response", {
    status: tokenResponse.status,
    ok: tokenResponse.ok,
    hasAccessToken: Boolean(accessToken),
    error: tokenData.error,
    errorDescription: tokenData.error_description,
  });

  if (!tokenResponse.ok || !accessToken) {
    const payload = { error: "Authorization failed" };
    return new Response(buildHtmlResponse(payload, false), {
      status: 502,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
      },
    });
  }

  const payload = { token: accessToken, provider: "github" };

  const headers = new Headers({
    "Content-Type": "text/html",
    "Cache-Control": "no-store",
  });

  headers.set(
    "Set-Cookie",
    "decap_state=; Path=/auth/callback; Max-Age=0; SameSite=Lax"
  );

  return new Response(buildHtmlResponse(payload, true), {
    headers,
  });
}
