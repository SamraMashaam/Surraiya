self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

console.log("SW active, ready for messages");

let timer = null;
let remainingTime = 0;
let mode = "work";
let sessionActive = false;

// Send current state to all clients
function notifyReact(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type, data });
    });
  });
}

self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  if (type === "PING") notifyReact("PONG", { msg: "I hear you" });
  if (type === "START_TIMER") startTimer(data);
  if (type === "PAUSE_TIMER") pauseTimer();
  if (type === "RESET_TIMER") resetTimer();
  if (type === "REQUEST_STATE") {
    notifyReact("STATE_SYNC", { remainingTime, mode, sessionActive });
  }
});

function startTimer({ duration, modeType }) {
  if (timer) clearInterval(timer);

  remainingTime = duration;
  mode = modeType;
  sessionActive = true;

  notifyReact("STATE_SYNC", { remainingTime, mode, sessionActive });

  timer = setInterval(() => {
    remainingTime--;

    if (remainingTime % 5 === 0) {
      notifyReact("STATE_SYNC", { remainingTime, mode, sessionActive });
    }

    if (remainingTime <= 0) {
      clearInterval(timer);
      sessionActive = false;
      notifyReact("STATE_SYNC", { remainingTime: 0, mode, sessionActive });
      showNotification(mode);
      notifyReact("SESSION_END", { mode });
    }
  }, 1000);
}

function pauseTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  sessionActive = false;
  notifyReact("STATE_SYNC", { remainingTime, mode, sessionActive });
}

function resetTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  sessionActive = false;
  remainingTime = 0;
  notifyReact("STATE_SYNC", { remainingTime, mode, sessionActive });
}

function showNotification(mode) {
  const messages = {
    work: "Work session complete! Time for a break.",
    shortBreak: "Short break over! Back to work.",
    longBreak: "Long break over! Let's get productive again.",
  };

  self.registration.showNotification("Focus Mode", {
    body: messages[mode],
    icon: "/logo192.png",
  });
}
