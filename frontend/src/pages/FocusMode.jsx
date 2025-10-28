import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./Styles/FocusMode.css";

function FocusMode() {
  // --- Load saved state if exists ---
  const saved = JSON.parse(localStorage.getItem("focusTimerState"));
  const [workLength, setWorkLength] = useState(saved?.workLength || 25);
  const [shortBreakLength, setShortBreakLength] = useState(saved?.shortBreakLength || 5);
  const [longBreakLength, setLongBreakLength] = useState(saved?.longBreakLength || 15);
  const [mode, setMode] = useState(saved?.mode || "work");
  const [isRunning, setIsRunning] = useState(saved?.isRunning || false);
  const [cycleCount, setCycleCount] = useState(saved?.cycleCount || 0);
  const [startTime, setStartTime] = useState(saved?.startTime ? new Date(saved.startTime) : null);
  const [duration, setDuration] = useState(saved?.duration || workLength * 60);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!saved?.startTime) return duration;
    const elapsed = (Date.now() - new Date(saved.startTime)) / 1000;
    return Math.max(saved.duration - elapsed, 0);
  });
  const [pausedTime, setPausedTime] = useState(null);


  const [user, setUser] = useState(null);
  // Use stored activeSessionId if present, otherwise create a new one
  const storedActiveId = localStorage.getItem("activeSessionId");
  const [sessionId, setSessionId] = useState(storedActiveId || uuidv4());

  const timerRef = useRef(null);

  // --- Restore user ---
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // --- Ask notification permission once ---
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // --- Persist state ---
  useEffect(() => {
    const state = {
      workLength,
      shortBreakLength,
      longBreakLength,
      mode,
      isRunning,
      cycleCount,
      startTime: startTime ? startTime.toISOString() : null,
      duration,
    };
    localStorage.setItem("focusTimerState", JSON.stringify(state));
  }, [workLength, shortBreakLength, longBreakLength, mode, isRunning, cycleCount, startTime, duration]);

  // --- Core virtual timer effect ---
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.getTime()) / 1000;
      const remaining = Math.max(duration - elapsed, 0);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleSessionEnd();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning, startTime, duration]);

  // --- DB sync every minute ---
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      const elapsed = (Date.now() - startTime.getTime()) / 1000;
      await saveSessionToDB(elapsed);
    }, 60000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const saveSessionToDB = async (durationSeconds, isFinal = false) => {
    if (!user) return;
    try {
      const data = {
        userId: user.id || user._id || user.userId,
        endTime: new Date(),
        duration: Math.round(durationSeconds / 60),
        isActive: !isFinal,
      };

      // canonical id to use for this session (prefer stored one)
      const existingId = localStorage.getItem("activeSessionId");

      if (!existingId) {
        // No existing session in storage -> create a new DB entry using current sessionId
        // Ensure sessionId state is set (in case it wasn't)
        const idToCreate = sessionId || uuidv4();
        setSessionId(idToCreate);

        const createData = {
          sessionId: idToCreate,
          userId: data.userId,
          startTime: startTime ? new Date(startTime) : new Date(),
          endTime: data.endTime,
          isActive: !isFinal,
          duration: data.duration,
        };

        await axios.post("http://localhost:5000/api/focus", createData);
        localStorage.setItem("activeSessionId", idToCreate);
        console.log("Created new session:", idToCreate);
      } else {
        // Update the existing session id (use the canonical existingId)
        await axios.put(`http://localhost:5000/api/focus/${existingId}`, data);
        console.log("Updated session:", existingId);
        // make sure component state matches storage
        if (existingId !== sessionId) setSessionId(existingId);
      }
    } catch (err) {
      console.error("DB sync error:", err);
    }
  };


  const sendNotification = (msg) => {
    if (Notification.permission === "granted") {
      new Notification("Focus Mode", { body: msg });
    } else {
      alert(msg);
    }
  };

  const handleSessionEnd = async () => {
    await saveSessionToDB(duration, true);
    localStorage.removeItem("activeSessionId");
    setIsRunning(false);

    if (mode === "work") {
      const newCycle = cycleCount + 1;
      setCycleCount(newCycle);

      let nextMode, nextDuration;
      if (newCycle % 4 === 0) {
        nextMode = "longBreak";
        nextDuration = longBreakLength * 60;
        sendNotification("Work complete! Time for a long break.");
      } else {
        nextMode = "shortBreak";
        nextDuration = shortBreakLength * 60;
        sendNotification("Work complete! Time for a short break.");
      }

      setMode(nextMode);
      setDuration(nextDuration);
      setTimeLeft(nextDuration);
    } else {
      setMode("work");
      setDuration(workLength * 60);
      setTimeLeft(workLength * 60);
      sendNotification("Break over! Back to work.");
    }

    setStartTime(null);
  };

  const handleStartPause = () => {
    if (isRunning) {
      // --- Pause timer ---
      clearInterval(timerRef.current);
      setIsRunning(false);
      setPausedTime(timeLeft);
      return;
    }

    // --- Resume timer ---
    const now = new Date();
    if (pausedTime !== null) {
      const newStartTime = new Date(now.getTime() - (duration - pausedTime) * 1000);
      setStartTime(newStartTime);
      setPausedTime(null);
    } else {
      setStartTime(now);
    }
    setIsRunning(true);
  };


  const handleReset = async () => {
    clearInterval(timerRef.current);
    if (startTime) {
      const durationSec = (Date.now() - startTime.getTime()) / 1000;
      await saveSessionToDB(durationSec, true);
    }
    localStorage.removeItem("activeSessionId");
    setSessionId(uuidv4());
    setIsRunning(false);
    setMode("work");
    setCycleCount(0);
    setStartTime(null);
    setDuration(workLength * 60);
    setTimeLeft(workLength * 60);
  };

  const handleWorkLengthChange = (e) => {
    const newWorkLength = parseInt(e.target.value);
    const newShort = Math.max(3, Math.round(newWorkLength / 5));
    const newLong = Math.max(10, Math.round(newWorkLength / 2));
    setWorkLength(newWorkLength);
    setShortBreakLength(newShort);
    setLongBreakLength(newLong);
    setDuration(newWorkLength * 60);
    setTimeLeft(newWorkLength * 60);
    setMode("work");
    setCycleCount(0);
    setStartTime(null);
    setIsRunning(false);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const colors = {
    work: "#a8dadc",
    shortBreak: "#abb3fbff",
    longBreak: "#c9b4dbff",
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="focus-container">
      <h1 className="focus-title">Focus Mode</h1>

      <div className="settings-card">
        <label className="settings-label">Session Length:</label>
        <select value={workLength} onChange={handleWorkLengthChange} className="settings-select">
          <option value={2}>2 min</option>
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

      <div
        className="timer-circle"
        style={{
          "--fill": `${progress}%`,
          "--liquid-color": colors[mode],
          "--glow-color": colors[mode],
          borderColor: colors[mode],
          boxShadow: `0 0 20px 4px ${colors[mode]}55`,
        }}
      >
        <span className="timer-text">{formatTime(timeLeft)}</span>
      </div>

      <h2 className="mode-label" style={{ color: colors[mode] }}>
        {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
      </h2>

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

      <p className="cycle-info">
        Completed cycles: {cycleCount} <br />
        Current Pomodoro: {(cycleCount % 4) + 1} of 4
      </p>
    </div>
  );
}

export default FocusMode;
