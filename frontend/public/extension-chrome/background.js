let USER_ID = null;
let API_URL = null;

async function syncBlockedSites() {
  if (!USER_ID) return;
  API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;

  const res = await fetch(API_URL);
  const blockedSites = await res.json();
  console.log("Sites: ", blockedSites);

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  if (!blockedSites.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    return;
  }

  const rules = blockedSites.map((site, i) => ({
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
    removeRuleIds: removeIds,
    addRules: rules
  });
}

// Receive user ID
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SET_USER_ID") {
    USER_ID = msg.userId;
    chrome.storage.local.set({ USER_ID });
    syncBlockedSites();
  }
});

// Restore user on browser start
chrome.storage.local.get(["USER_ID"], (res) => {
  if (res.USER_ID) {
    USER_ID = res.USER_ID;
    syncBlockedSites();
  }
});


setInterval(syncBlockedSites, 60000);
