let USER_ID = null;
let FOCUS_MODE = "off";

console.log("🟢 Extension loaded");

// Session state
let sessionActive = false;
let inactivityThreshold = 1; // Default 1 minute
let lastActivityTime = Date.now();
let checkActivityInterval = null;
let notificationWindowId = null;

// Keep service worker alive
let keepAliveInterval = setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {});
}, 20000);

console.log("💓 Keepalive started");


// ============ ACTIVITY TRACKING ============
function resetActivityTimer() {
  lastActivityTime = Date.now();
  console.log("✅ Activity timer reset");
}

function checkInactivity() {
  if (!sessionActive) return;

  const now = Date.now();
  const inactiveMinutes = (now - lastActivityTime) / 1000 / 60;

  console.log(`⏰ Checking inactivity: ${inactiveMinutes.toFixed(2)}min / ${inactivityThreshold}min`);

  if (inactiveMinutes >= inactivityThreshold) {
    console.log("⚠️ INACTIVITY THRESHOLD REACHED - Showing notification");
    showInactivityAlert();
  }
}

function showInactivityAlert() {
  // Prevent multiple popups
  if (notificationWindowId) {
    console.log("⚠️ Notification already open");
    return;
  }

  chrome.system.display.getInfo((displays) => {
    const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
    const screenWidth = primaryDisplay.workArea.width;
    const screenHeight = primaryDisplay.workArea.height;

    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 450,
      height: 300,
      top: Math.floor((screenHeight - 300) / 2),
      left: Math.floor((screenWidth - 450) / 2),
      focused: true
    }, (window) => {
      notificationWindowId = window.id;
      console.log('🔔 Focus reminder popup shown');

      // Stop checking while notification is open
      if (checkActivityInterval) {
        clearInterval(checkActivityInterval);
        checkActivityInterval = null;
      }
    });
  });
}

function startActivityTracking() {
  console.log("🚀 Starting activity tracking");
  sessionActive = true;
  resetActivityTimer();

  // Check every 5 seconds
  if (checkActivityInterval) {
    clearInterval(checkActivityInterval);
  }
  checkActivityInterval = setInterval(checkInactivity, 5000);
}

function stopActivityTracking() {
  console.log("🛑 Stopping activity tracking");
  sessionActive = false;

  if (checkActivityInterval) {
    clearInterval(checkActivityInterval);
    checkActivityInterval = null;
  }

  // Close notification if open
  if (notificationWindowId) {
    chrome.windows.remove(notificationWindowId).catch(() => {});
    notificationWindowId = null;
  }
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Start focus session
  if (request.action === "startSession") {
    inactivityThreshold = request.threshold || 1;
    startActivityTracking();
    console.log("🎯 Focus session started with threshold:", inactivityThreshold);
    sendResponse({ success: true });
    return true;
  }

  // Stop focus session
  if (request.action === "stopSession") {
    stopActivityTracking();
    console.log("🛑 Focus session stopped");
    sendResponse({ success: true });
    return true;
  }

  // Update inactivity threshold
  if (request.action === "updateThreshold") {
    inactivityThreshold = request.threshold || inactivityThreshold;
    console.log("⏱️ Updated inactivity threshold:", inactivityThreshold);
    sendResponse({ success: true });
    return true;
  }

  // Activity detected from content script
  if (request.action === 'activityDetected') {
    if (sessionActive) {
      console.log("👆 Activity detected:", request.type);
      resetActivityTimer();
    }
    sendResponse({ success: true });
    return true;
  }

  // Notification dismissed
  if (request.action === 'notificationDismissed') {
    console.log("✅ Notification dismissed - restarting tracking");
    notificationWindowId = null;
    
    if (sessionActive) {
      resetActivityTimer();
      // Restart checking
      if (checkActivityInterval) {
        clearInterval(checkActivityInterval);
      }
      checkActivityInterval = setInterval(checkInactivity, 5000);
    }
    
    sendResponse({ success: true });
    return true;
  }

  // Sync blocklist (from focus page)
  if (request.action === 'syncBlocklist') {
    syncBlockedSites().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  sendResponse({ success: false });
  return true;
});

// Listen for long-lived connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
  console.log(`🔌 New connection from: ${port.name}`);
  
  // Make sure this is our activity tracker
  if (port.name === "activity-tracker") {
    
    // Listen for messages on this specific port
    port.onMessage.addListener((msg) => {
      if (msg.action === 'activityDetected') {
        if (sessionActive) {
          // Note: The log now includes a specific "port" source
          console.log("👆 Activity detected (via port):", msg.type);
          resetActivityTimer();
        }
      }
    });

    // This will log when the content script's page is closed or it disconnects
    port.onDisconnect.addListener(() => {
      console.log(`🔌 Port disconnected: ${port.name}`);
    });
  }
});

// Window closed handler
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === notificationWindowId) {
    console.log("🔔 Notification window closed");
    notificationWindowId = null;
    
    if (sessionActive) {
      resetActivityTimer();
      // Restart checking
      if (checkActivityInterval) {
        clearInterval(checkActivityInterval);
      }
      checkActivityInterval = setInterval(checkInactivity, 5000);
    }
  }
});


// On startup/install
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Extension startup');
  syncBlockedSites();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed/updated');
  syncBlockedSites();
});

async function clearRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map(r => r.id),
      addRules: []
    });
  }
}

async function syncBlockedSites() {
  if (!USER_ID || FOCUS_MODE !== "work") return;

  const API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;
  const res = await fetch(API_URL);
  const sites = await res.json();
  console.log("Blocklist:", sites);

  // Always clear first to avoid duplicate IDs
  await clearRules();

  if (!sites?.length) return;

  const rules = sites.map((site, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: `chrome-extension://${chrome.runtime.id}/focus.html?site=${encodeURIComponent(site)}`
      }
    },
    condition: {
      urlFilter: `||${site}^`,
      resourceTypes: ["main_frame"]
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules
  });
}

// Receive messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SET_USER_ID") {
    USER_ID = msg.userId;
    chrome.storage.local.set({ USER_ID });
    syncBlockedSites();
  }

  if (msg.action === "SET_FOCUS_MODE") {
    FOCUS_MODE = msg.mode;
    chrome.storage.local.set({ FOCUS_MODE });

    if (FOCUS_MODE !== "work") {
      clearRules();
    } else {
      syncBlockedSites();
    }
  }
});

// Restore state on wake
chrome.storage.local.get(["USER_ID", "FOCUS_MODE"], (res) => {
  USER_ID = res.USER_ID || null;
  FOCUS_MODE = res.FOCUS_MODE || "off";

  if (FOCUS_MODE === "work") syncBlockedSites();
});

// Keep rules synced every minute (only in work mode)
setInterval(() => {
  if (FOCUS_MODE === "work") syncBlockedSites();
}, 60000);
