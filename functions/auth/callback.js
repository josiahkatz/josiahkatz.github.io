const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = rest.join("=");
    return acc;
  }, {});

const buildHtmlResponse = (payload, isSuccess) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authentication ${isSuccess ? "Complete" : "Failed"}</title>
  </head>
  <body>
    <script>
      (function () {
        var message = 'authorization:github:${isSuccess ? "success" : "error"}:' + JSON.stringify(${payload});
        if (window.opener) {
          window.opener.postMessage(message, '*');
        }
        window.close();
      })();
    </script>
  </body>
</html>`;

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response("Missing GitHub OAuth credentials", { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const expectedState = cookies.decap_state;

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  if (expectedState && state !== expectedState) {
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

  if (!tokenResponse.ok || !accessToken) {
    const payload = { error: "Authorization failed" };
    return new Response(buildHtmlResponse(JSON.stringify(payload), false), {
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

  return new Response(buildHtmlResponse(JSON.stringify(payload), true), {
    headers,
  });
}
