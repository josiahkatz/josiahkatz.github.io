const LIVE_RELOAD_KEY = "livereload-active";
const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
  window.location.hostname
);

const setLiveReloadState = (value) => {
  try {
    window.localStorage.setItem(LIVE_RELOAD_KEY, value ? "true" : "false");
  } catch (error) {
    // Ignore storage errors.
  }
};

if (!isLocalHost) {
  setLiveReloadState(false);
}

if (isLocalHost) {
  let source;

  const startEventSource = () => {
    if (source) return;
    source = new EventSource("/__livereload");
    setLiveReloadState(true);

    source.addEventListener("message", () => {
      window.location.reload();
    });

    source.addEventListener("error", () => {
      source.close();
      source = undefined;
      setLiveReloadState(false);
      setTimeout(checkAndConnect, 2000);
    });
  };

  const checkAndConnect = async () => {
    try {
      const response = await fetch("/__livereload-check", { cache: "no-store" });
      if (response.ok) {
        startEventSource();
        return;
      }
    } catch (error) {
      // Dev server not running yet.
    }

    setLiveReloadState(false);
    setTimeout(checkAndConnect, 2000);
  };

  checkAndConnect();
}
