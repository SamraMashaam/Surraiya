let USER_ID = null;
let FOCUS_MODE = "off";

console.log("🦊 Firefox extension loaded");

// Session state
let sessionActive = false;
let inactivityThreshold = 1; 
let lastActivityTime = Date.now();
let checkActivityInterval = null;
let notificationWindowId = null;

// ============ ACTIVITY TRACKING ============
function resetActivityTimer() {
  lastActivityTime = Date.now();
  console.log("Activity timer reset");
}

function checkInactivity() {
  if (!sessionActive) return;

  const now = Date.now();
  const inactiveMinutes = (now - lastActivityTime) / 1000 / 60;

  console.log(`⏰ Inactive: ${inactiveMinutes.toFixed(2)} / ${inactivityThreshold}`);

  if (inactiveMinutes >= inactivityThreshold) {
    showInactivityAlert();
  }
}

function showInactivityAlert() {
  if (notificationWindowId) return;

  browser.windows.create({
    url: browser.runtime.getURL("popup.html"),
    type: "popup",
    width: 450,
    height: 300
  }).then(window => {
    notificationWindowId = window.id;
    console.log("🔔 Popup shown");

    if (checkActivityInterval) clearInterval(checkActivityInterval);
  });
}

function startActivityTracking() {
  console.log("🚀 Starting activity tracking");
  sessionActive = true;
  resetActivityTimer();

  if (checkActivityInterval) clearInterval(checkActivityInterval);
  checkActivityInterval = setInterval(checkInactivity, 5000);
}

function stopActivityTracking() {
  console.log("🛑 Stopping activity tracking");
  sessionActive = false;

  if (checkActivityInterval) clearInterval(checkActivityInterval);

  if (notificationWindowId) {
    browser.windows.remove(notificationWindowId).catch(() => {});
    notificationWindowId = null;
  }
}

// ========== MESSAGE HANDLING ==========
browser.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "startSession") {
    inactivityThreshold = request.threshold || 1;
    startActivityTracking();
    return Promise.resolve({ success: true });
  }

  if (request.action === "stopSession") {
    stopActivityTracking();
    return Promise.resolve({ success: true });
  }

  if (request.action === "updateThreshold") {
    inactivityThreshold = request.threshold || inactivityThreshold;
    console.log("⏱️ Threshold updated:", inactivityThreshold);
    return Promise.resolve({ success: true });
  }

  if (request.action === "activityDetected") {
    if (sessionActive) resetActivityTimer();
    return Promise.resolve({ success: true });
  }

  if (request.action === "notificationDismissed") {
    notificationWindowId = null;
    if (sessionActive) {
      resetActivityTimer();
      if (checkActivityInterval) clearInterval(checkActivityInterval);
      checkActivityInterval = setInterval(checkInactivity, 5000);
    }
    return Promise.resolve({ success: true });
  }

  if (request.action === "syncBlocklist") {
    syncBlockedSites();
    return Promise.resolve({ success: true });
  }

  return Promise.resolve({ success: false });
});

// Port messages from content script
browser.runtime.onConnect.addListener(port => {
  console.log(`🔌 Port connected: ${port.name}`);

  if (port.name === "activity-tracker") {
    port.onMessage.addListener(msg => {
      if (msg.action === "activityDetected" && sessionActive) {
        resetActivityTimer();
      }
    });
  }
});

// Window closed
browser.windows.onRemoved.addListener(windowId => {
  if (windowId === notificationWindowId) {
    notificationWindowId = null;
    if (sessionActive) {
      resetActivityTimer();
      if (checkActivityInterval) clearInterval(checkActivityInterval);
      checkActivityInterval = setInterval(checkInactivity, 5000);
    }
  }
});

// ===== BLOCKING / REDIRECT =====

let currentRules = [];

function clearRules() {
  if (currentRules.length) {
    browser.webRequest.onBeforeRequest.removeListener(blockRequestHandler);
    currentRules = [];
  }
}

function blockRequestHandler(details) {
  for (const site of currentRules) {
    if (details.url.includes(site)) {
      return { redirectUrl: browser.runtime.getURL(`focus.html?site=${encodeURIComponent(site)}`) };
    }
  }
}

async function syncBlockedSites() {
  if (!USER_ID || FOCUS_MODE !== "work") return;

  const res = await fetch(`http://localhost:5000/api/blocklist/${USER_ID}`);
  const sites = await res.json();

  clearRules();
  currentRules = sites;

  if (sites.length > 0) {
    browser.webRequest.onBeforeRequest.addListener(
      blockRequestHandler,
      { urls: ["<all_urls>"] },
      ["blocking"]
    );
  }

  console.log("🛑 Blocklist updated:", sites);
}

// ===== App state messages =====
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SET_USER_ID") {
    USER_ID = msg.userId;
    browser.storage.local.set({ USER_ID });
    syncBlockedSites();
  }

  if (msg.action === "SET_FOCUS_MODE") {
    FOCUS_MODE = msg.mode;
    browser.storage.local.set({ FOCUS_MODE });

    if (FOCUS_MODE !== "work") {
      clearRules();
    } else {
      syncBlockedSites();
    }
  }
});

// Restore state
browser.storage.local.get(["USER_ID", "FOCUS_MODE"]).then(res => {
  USER_ID = res.USER_ID || null;
  FOCUS_MODE = res.FOCUS_MODE || "off";
  if (FOCUS_MODE === "work") syncBlockedSites();
});
