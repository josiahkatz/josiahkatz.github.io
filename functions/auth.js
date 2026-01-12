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
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/auth/callback`;
  const scope = url.searchParams.get("scope") || "public_repo";

  const authUrl = new URL(GITHUB_AUTHORIZE_URL);
  authUrl.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const headers = new Headers({
    "Content-Type": "text/html",
    "Cache-Control": "no-store",
  });

  headers.set(
    "Set-Cookie",
    buildStateCookie(state, url.protocol === "https:")
  );

  const authUrlString = authUrl.toString();
  const responseHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authorizing...</title>
  </head>
  <body>
    <script>
      (function () {
        var authUrl = ${JSON.stringify(authUrlString)};
        var origin = ${JSON.stringify(origin)};
        var redirected = false;
        var redirect = function () {
          if (redirected) return;
          redirected = true;
          window.location.href = authUrl;
        };
        if (!window.opener) {
          redirect();
          return;
        }
        window.opener.postMessage("authorizing:github", origin);
        window.addEventListener("message", function onMessage(event) {
          if (event.origin !== origin) return;
          if (event.data === "authorizing:github") {
            window.removeEventListener("message", onMessage);
            redirect();
          }
        });
        setTimeout(redirect, 1500);
      })();
    </script>
  </body>
</html>`;

  return new Response(responseHtml, { status: 200, headers });
}
