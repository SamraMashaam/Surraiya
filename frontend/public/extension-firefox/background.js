let USER_ID = null;
let API_URL = null;
let blockedSites = [];
let FOCUS_MODE = "off";
console.log("Initial FOCUS_MODE =", FOCUS_MODE);



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

    if (FOCUS_MODE === "work" && blockedSites.includes(domain)) {
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
  if (msg.action === "SET_FOCUS_MODE") {
    FOCUS_MODE = msg.mode;
    browser.storage.local.set({ FOCUS_MODE });
  }

  if (msg.action === "SET_USER_ID") {
    USER_ID = msg.userId;
    browser.storage.local.set({ USER_ID });
    syncBlockedSites();
  }
});

browser.storage.local.get(["USER_ID", "FOCUS_MODE"]).then((res) => {
  if (res.USER_ID) USER_ID = res.USER_ID;
  if (res.FOCUS_MODE) FOCUS_MODE = res.FOCUS_MODE;
  if (FOCUS_MODE === "work") syncBlockedSites();
});


setInterval(syncBlockedSites, 60000);
