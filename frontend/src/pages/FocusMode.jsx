import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // to generate sessionId
import "./Styles/FocusMode.css";

function FocusMode() {
  // Default settings
  const [workLength, setWorkLength] = useState(25);
  const [shortBreakLength, setShortBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);

  const [timeLeft, setTimeLeft] = useState(workLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [cycleCount, setCycleCount] = useState(0);

  const [sessionId, setSessionId] = useState(uuidv4());
  const [startTime, setStartTime] = useState(null);
  const [user, setUser] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "PING" });
  }
  navigator.serviceWorker.addEventListener("message", (e) =>
    console.log("From SW:", e.data)
  );
}, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
      });
    }
  }, []);

  useEffect(() => {
    const state = {
      timeLeft,
      mode,
      isRunning,
      cycleCount,
      startTime,
      timestamp: Date.now(), //store current time
    };
    localStorage.setItem("focusTimerState", JSON.stringify(state));
  }, [timeLeft, mode, isRunning, cycleCount, startTime]);


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("focusTimerState"));
    if (saved) {
      const now = Date.now();
      const elapsed = Math.floor((now - saved.timestamp) / 1000); // seconds passed since save
      const newTimeLeft = Math.max(saved.timeLeft - elapsed, 0);

      setTimeLeft(newTimeLeft);
      setMode(saved.mode);
      setCycleCount(saved.cycleCount);
      setStartTime(saved.startTime);

      if (saved.isRunning && newTimeLeft > 0) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  }, []);

  // --- Service Worker Communication ---
  const sendToServiceWorker = (type, data = {}) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, data });
    } else {
      console.warn("No active service worker controller found");
    }
  };

  // Listen for messages *from* service worker
  useEffect(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        const { type, data } = event.data;

        if (type === "STATE_UPDATE") {
          // Restore timer from service worker
          localStorage.setItem("focusState", JSON.stringify(data));
          restoreTimer(data);
        } else if (type === "SAVE_STATE") {
          // Save state in localStorage whenever SW sends it
          localStorage.setItem("focusState", JSON.stringify(data));
        } else if (type === "SESSION_END") {
          handleSessionEnd(data.mode);
        }
      });

      // Ask service worker for current state (in case of reload)
      navigator.serviceWorker.controller?.postMessage({ type: "REQUEST_STATE" });
    }

    // On mount, also check localStorage
    const saved = localStorage.getItem("focusState");
    if (saved) restoreTimer(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handleSWMessage = (event) => {
      const { type, data } = event.data;
      if (type === "STATE_SYNC") {
        console.log("Restoring from SW:", data);
        setMode(data.mode);
        setIsRunning(data.sessionActive);
        setTimeLeft(data.remainingTime);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleSWMessage);

    // Ask for the current state every time we reload or come back
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "REQUEST_STATE" });
    }

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSWMessage);
    };
  }, []);


  function restoreTimer(state) {
    if (!state.sessionActive) return;
    setMode(state.mode);
    setTimeLeft(state.remainingTime);
    setIsRunning(state.sessionActive);
  }

  const saveSessionToDB = async (durationSeconds) => {
    try {
      const data = {
        sessionId,
        userId: user.id,
        startTime,
        endTime: new Date(),
        isActive: false,
        duration: Math.round(durationSeconds / 60), // convert to minutes
      };

      await axios.post("http://localhost:5000/api/focus", data);
      console.log("Session saved:", data);
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  // Format seconds → mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  //  Send notification
  const sendNotification = (message) => {
    console.log("sending notification:", message);
    if (Notification.permission === "granted") {
      new Notification("Focus Mode", { body: message });
    } else {
      alert(message); // fallback
    }
  };

  //  Centralized session end logic
  const handleSessionEnd = () => {
    if (mode === "work") {
      const newCycle = cycleCount + 1;
      setCycleCount(newCycle);

      if (newCycle % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(longBreakLength * 60);
        sendNotification("Work complete! Time for a long break.");
      } else {
        setMode("shortBreak");
        setTimeLeft(shortBreakLength * 60);
        sendNotification("Work complete! Time for a short break.");
      }
    } else {
      setMode("work");
      setTimeLeft(workLength * 60);
      sendNotification("Break finished! Back to work.");
    }

    setIsRunning(false);
  };

  const handleReset = async () => {
    sendToServiceWorker("RESET_TIMER");
    clearInterval(timerRef.current);
    setIsRunning(false);
    setMode("work");

    const endTime = new Date();
    if (startTime) {
      const duration = (endTime - new Date(startTime)) / 1000;
      await saveSessionToDB(duration); //  still saves to backend
    }

    setStartTime(null);
    setSessionId(uuidv4());
    setTimeLeft(workLength * 60);
    setCycleCount(0);

    //  Clear local state + storage
    localStorage.removeItem("focusState");
  };


  const handleStartPause = () => {
    if (!isRunning && !startTime) {
      setStartTime(new Date());
    }

    if (!isRunning) {
      //  Start timer in service worker
      sendToServiceWorker("START_TIMER", {
        duration: timeLeft,
        modeType: mode,
      });

      //  Store locally so reloads can restore it
      localStorage.setItem(
        "focusState",
        JSON.stringify({
          remainingTime: timeLeft,
          mode,
          sessionActive: true,
          timestamp: Date.now(),
        })
      );
    } else {
      //  Pause timer in service worker
      sendToServiceWorker("PAUSE_TIMER");

      localStorage.setItem(
        "focusState",
        JSON.stringify({
          remainingTime: timeLeft,
          mode,
          sessionActive: false,
          timestamp: Date.now(),
        })
      );
    }

    setIsRunning((prev) => !prev);
  };

  //  Timer effect only depends on isRunning
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) return prev - 1;

        clearInterval(timerRef.current);
        handleSessionEnd();
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  

  const handleWorkLengthChange = (e) => {
    const newWorkLength = parseInt(e.target.value);
    setWorkLength(newWorkLength);
    setShortBreakLength(Math.max(3, Math.round(newWorkLength / 5)));
    setLongBreakLength(Math.max(10, Math.round(newWorkLength / 2)));
    setTimeLeft(newWorkLength * 60);
    setMode("work");
    setIsRunning(false);
    setCycleCount(0);
  };

  const totalTime =
    mode === "work"
      ? workLength * 60
      : mode === "shortBreak"
      ? shortBreakLength * 60
      : longBreakLength * 60;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const colors = {
    work: "#a8dadc",
    shortBreak: "#abb3fbff",
    longBreak: "#c9b4dbff",
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("message", async (event) => {
      const { type, data } = event.data;

      if (type === "SESSION_END") {
        console.log("Session ended:", data.mode);

        // Stop UI timer if running
        setIsRunning(false);

        // Save session data
        const endTime = new Date();
        if (startTime) {
          const duration = (endTime - new Date(startTime)) / 1000;
          await saveSessionToDB(duration);
        }

        // Switch mode automatically
        if (data.mode === "work") {
          // Move to break
          const newCycle = cycleCount + 1;
          setCycleCount(newCycle);

          if (newCycle % 4 === 0) {
            setMode("longBreak");
            setTimeLeft(longBreakLength * 60);
          } else {
            setMode("shortBreak");
            setTimeLeft(shortBreakLength * 60);
          }

          sendNotification("Work complete! Time for a break.");
        } else {
          // Move back to work
          setMode("work");
          setTimeLeft(workLength * 60);
          sendNotification("Break finished! Back to work.");
        }
        setStartTime(new Date());
        // Restart timer automatically
        sendToServiceWorker("START_TIMER", {
          duration:
            data.mode === "work"
              ? shortBreakLength * 60
              : workLength * 60,
          modeType: data.mode === "work" ? "shortBreak" : "work",
        });

        // Update local storage
        localStorage.setItem(
          "focusState",
          JSON.stringify({
            remainingTime:
              data.mode === "work"
                ? shortBreakLength * 60
                : workLength * 60,
            mode: data.mode === "work" ? "shortBreak" : "work",
            sessionActive: true,
            timestamp: Date.now(),
          })
        );
      }
    });
  }, [startTime, cycleCount, workLength, shortBreakLength, longBreakLength]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      const elapsed = (new Date() - new Date(startTime)) / 1000;
      await saveSessionToDB(elapsed);
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="focus-container">
      <h1 className="focus-title">Focus Mode</h1>

      {/* Settings */}
      <div className="settings-card">
        <label className="settings-label">Session Length:</label>
        <select
          value={workLength}
          onChange={handleWorkLengthChange}
          className="settings-select"
        >
          <option value={1}>1 min</option>
          <option value={15}>15 min</option>
          <option value={20}>20 min</option>
          <option value={25}>25 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
        </select>
        <p className="settings-subtext">
          Short Break: {shortBreakLength} min | Long Break: {longBreakLength} min
        </p>
      </div>

      {/* Circular Timer */}
      <div
        className="timer-circle"
        style={{
          "--fill": `${progress}%`,
          "--liquid-color": colors[mode],
          "--glow-color": colors[mode],
          borderColor: colors[mode],
          boxShadow: `0 0 20px 4px ${colors[mode]}55`
        }}
      >
        <span className="timer-text">{formatTime(timeLeft)}</span>
      </div>



      {/* Mode Label */}
      <h2 className="mode-label" style={{ color: colors[mode] }}>
        {mode === "work"
          ? "Focus Time"
          : mode === "shortBreak"
          ? "Short Break"
          : "Long Break"}
      </h2>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={handleStartPause}
          className="btn"
          style={{ background: colors[mode] }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={handleReset} className="btn reset-btn">
          Reset
        </button>
      </div>

      {/* Cycle Info */}
      <p className="cycle-info">
        Completed cycles: {cycleCount} <br />
        Current Pomodoro: {(cycleCount % 4) + 1} of 4
      </p>
    </div>
  );
}

export default FocusMode;
