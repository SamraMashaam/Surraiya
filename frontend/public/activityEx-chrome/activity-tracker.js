(() => {
console.log('Activity tracker loaded on:', window.location.hostname);

// Establish a connection to the background script
let port = null;
try {
  if (typeof chrome !== "undefined" && chrome.runtime?.connect) {
    port = chrome.runtime.connect({ name: "activity-tracker" });
  }
} catch (e) {
  console.warn("Chrome runtime not available in this context");
}


// When the extension is reloaded, the port will disconnect.
port.onDisconnect.addListener(() => {
  console.warn("Port disconnected — reconnecting...");
  setTimeout(() => {
    chrome.runtime.connect({ name: "activity-tracker" });
  }, 500);
});

document.addEventListener("keydown", () => {
  window.postMessage({ type: "ACTIVITY_MSG", payload: { action: "activityDetected", type: "keyboard" } }, "*");
});


let lastMouseX = 0;
let lastMouseY = 0;
let isActive = true;

// Debounce to prevent too many messages
let activityDebounceTimer = null;

function sendActivityToBackground(type) {
  // Debounce: only send once per second
  if (activityDebounceTimer) return;

  activityDebounceTimer = setTimeout(() => {
    activityDebounceTimer = null;
  }, 1000);

  try {
    port.postMessage({
      action: 'activityDetected',
      type: type
    });
  } catch (err) {
    console.log('Failed to send activity', err);
  }
}

// Mouse movement detection
function handleMouseMove(e) {
  const deltaX = Math.abs(e.clientX - lastMouseX);
  const deltaY = Math.abs(e.clientY - lastMouseY);

  if (deltaX > 3 || deltaY > 3) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    sendActivityToBackground('mouse');
  }
}

// Keyboard detection
function handleKeyboard(e) {
  sendActivityToBackground('keyboard');
}

// Click detection
function handleClick(e) {
  sendActivityToBackground('click');
}

// Scroll detection
function handleScroll(e) {
  sendActivityToBackground('scroll');
}

// Add event listeners
document.addEventListener('mousemove', handleMouseMove, { passive: true });
document.addEventListener('keydown', handleKeyboard, { passive: true });
document.addEventListener('click', handleClick, { passive: true });
document.addEventListener('scroll', handleScroll, { passive: true });
document.addEventListener('wheel', handleScroll, { passive: true });

console.log('Activity tracker initialized');

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

// Listen for messages from webpage → forward to extension
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "ACTIVITY_MSG") {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
  chrome.runtime.sendMessage(event.data.payload, (response) => {
    window.postMessage({ type: "ACTIVITY_REPLY", response }, "*");
  });
}

  }
});
})();
