(() => {
  console.log("🦊 Firefox Activity Tracker loaded on:", window.location.hostname);

  // Connect to background script
  let port;
  try {
    port = browser.runtime.connect({ name: "activity-tracker" });
  } catch (e) {
    console.warn("⚠️ Firefox runtime not available yet");
  }

  // Reconnect if Firefox unloads background script
  if (port && port.onDisconnect) {
    port.onDisconnect.addListener(() => {
      console.warn("⚡ Port disconnected — reconnecting...");
      setTimeout(() => {
        try {
          port = browser.runtime.connect({ name: "activity-tracker" });
        } catch {}
      }, 500);
    });
  }

  // Send activity to background (debounced)
  let debounceTimer = null;
  function sendActivity(type) {
    if (!port) return;
    if (debounceTimer) return;

    debounceTimer = setTimeout(() => (debounceTimer = null), 1000);

    try {
      port.postMessage({ action: "activityDetected", type });
    } catch (e) {
      console.warn("sendActivity failed", e);
    }
  }

  // Mouse movement detection
  let lastX = 0, lastY = 0;
  function onMouseMove(e) {
    const dx = Math.abs(e.clientX - lastX);
    const dy = Math.abs(e.clientY - lastY);
    if (dx > 3 || dy > 3) {
      lastX = e.clientX;
      lastY = e.clientY;
      sendActivity("mouse");
    }
  }

  // Other activity events
  function onKey() { sendActivity("keyboard"); }
  function onClick() { sendActivity("click"); }
  function onScroll() { sendActivity("scroll"); }

  document.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("keydown", onKey, { passive: true });
  document.addEventListener("click", onClick, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("wheel", onScroll, { passive: true });

  console.log("✅ Firefox Activity tracker initialized");

  // Send messages to background on behalf of web-app
  function sendToBackground(msg) {
    try { browser.runtime.sendMessage(msg); } 
    catch (e) { console.warn("sendMessage failed", e); }
  }

  // Listen for messages from webpage → forward to background
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "USER_ID") {
      sendToBackground({ action: "SET_USER_ID", userId: event.data.userId });
    }

    if (event.data?.type === "FOCUS_MODE") {
      sendToBackground({ action: "SET_FOCUS_MODE", mode: event.data.mode });
    }

    if (event.data?.type === "ACTIVITY_MSG") {
      browser.runtime.sendMessage(event.data.payload).then((reply) => {
        window.postMessage({ type: "ACTIVITY_REPLY", response: reply }, "*");
      }).catch(() => {});
    }
  });
})();
