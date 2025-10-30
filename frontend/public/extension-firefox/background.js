let USER_ID = null;
let API_URL = null;
let blockedSites = [];

async function syncBlockedSites() {
  if (!USER_ID) return;
  API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;
  
  const res = await fetch(API_URL);
  blockedSites = await res.json();
  console.log(blockedSites);
}

// Intercept requests
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const domain = url.hostname.replace("www.", "");

    if (blockedSites.includes(domain)) {
      return { redirectUrl: browser.runtime.getURL(`focus.html?site=${domain}`) };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Receive user ID
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SET_USER_ID") {
    USER_ID = msg.userId;
    browser.storage.local.set({ USER_ID });
    syncBlockedSites();
  }
});

// Restore user on startup
browser.storage.local.get("USER_ID").then((res) => {
  if (res.USER_ID) {
    USER_ID = res.USER_ID;
    syncBlockedSites();
  }
});

setInterval(syncBlockedSites, 60000);
