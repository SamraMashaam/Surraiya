let USER_ID = null;
let FOCUS_MODE = "off";


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
