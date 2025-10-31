// Listen for messages from the webpage
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "USER_ID") {
    chrome.runtime?.sendMessage({
      action: "SET_USER_ID",
      userId: event.data.userId,
    });
    browser?.runtime?.sendMessage({
      action: "SET_USER_ID",
      userId: event.data.userId,
    });
  }
});
// Focus mode message from page
window.addEventListener("message", (event) => {
  if (event.data?.type === "FOCUS_MODE") {
    chrome.runtime?.sendMessage({
      action: "SET_FOCUS_MODE",
      mode: event.data.mode,
    });

    browser?.runtime?.sendMessage({
      action: "SET_FOCUS_MODE",
      mode: event.data.mode,
    });
  }
});
