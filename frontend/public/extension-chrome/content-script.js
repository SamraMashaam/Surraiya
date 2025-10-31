// ==== Safe Chrome messaging wrapper ====
function safeSendMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError) {
        console.warn("sendMessage error:", chrome.runtime.lastError.message);
      }
    });
  } catch (e) {
    console.warn("Extension SW not available yet");
  }
}

// Listen for messages from webpage
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  // Receive user id from app
  if (event.data?.type === "USER_ID") {
    safeSendMessage({
      action: "SET_USER_ID",
      userId: event.data.userId,
    });
  }

  // Receive focus mode status
  if (event.data?.type === "FOCUS_MODE") {
    safeSendMessage({
      action: "SET_FOCUS_MODE",
      mode: event.data.mode,
    });
  }
});
