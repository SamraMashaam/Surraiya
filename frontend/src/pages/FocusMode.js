import React, { useState, useEffect, useRef } from "react";
import "./FocusMode.css";

function FocusMode() {
  // Default settings
  const [workLength, setWorkLength] = useState(25);
  const [shortBreakLength, setShortBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);

  const [timeLeft, setTimeLeft] = useState(workLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work"); // "work", "shortBreak", "longBreak"
  const [cycleCount, setCycleCount] = useState(0);

  const timerRef = useRef(null);

  // Format seconds → mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 🔔 Send notification
  const sendNotification = (message) => {
    console.log("sending notification:", message);
    if (Notification.permission === "granted") {
      new Notification("Focus Mode", { body: message });
    } else {
      alert(message); // fallback
    }
  };

  // ✅ Centralized session end logic
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

  // ✅ Timer effect only depends on isRunning
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

  const handleStartPause = () => setIsRunning((prev) => !prev);

  const handleReset = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setMode("work");
    setTimeLeft(workLength * 60);
    setCycleCount(0);
  };

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
    shortBreak: "#fbc4ab",
    longBreak: "#cdb4db",
  };

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
          background: `conic-gradient(${colors[mode]} ${progress}%, #f5f5f5 ${progress}%)`,
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
