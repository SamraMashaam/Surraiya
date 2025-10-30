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
