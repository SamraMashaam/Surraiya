import React, { useState, useEffect, useRef } from "react";

function FocusMode() {
  // Default settings
  const [workLength, setWorkLength] = useState(25); // minutes
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

  // 🔔 Send browser notification
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
        handleSessionEnd(); // only called once
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning]); // 👈 no extra dependencies

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setMode("work");
    setTimeLeft(workLength * 60);
    setCycleCount(0);
  };

  // Handle dropdown change
  const handleWorkLengthChange = (e) => {
    const newWorkLength = parseInt(e.target.value);
    setWorkLength(newWorkLength);

    // Adjust break lengths relative to work time
    setShortBreakLength(Math.max(3, Math.round(newWorkLength / 5))); // ~20%
    setLongBreakLength(Math.max(10, Math.round(newWorkLength / 2))); // ~50%

    setTimeLeft(newWorkLength * 60);
    setMode("work");
    setIsRunning(false);
    setCycleCount(0);
  };

  // Calculate progress %
  const totalTime =
    mode === "work"
      ? workLength * 60
      : mode === "shortBreak"
      ? shortBreakLength * 60
      : longBreakLength * 60;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Pastel color palette
  const colors = {
    work: "#a8dadc",       // pastel blue
    shortBreak: "#fbc4ab", // pastel peach
    longBreak: "#cdb4db"   // pastel lavender
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fdfdfd",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <h1 style={{ color: "#333", marginBottom: "10px" }}>Focus Mode</h1>

      {/* Settings */}
      <div
        style={{
          background: "#fff",
          padding: "15px 20px",
          borderRadius: "15px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "20px"
        }}
      >
        <label style={{ fontWeight: "bold", marginRight: "10px" }}>
          Session Length:
        </label>
        <select
          value={workLength}
          onChange={handleWorkLengthChange}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        >
          <option value={1}>1 min</option>
          <option value={15}>15 min</option>
          <option value={20}>20 min</option>
          <option value={25}>25 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
        </select>
        <p style={{ margin: "10px 0 0 0", fontSize: "0.9rem", color: "#555" }}>
          Short Break: {shortBreakLength} min | Long Break: {longBreakLength} min
        </p>
      </div>

      {/* Circular Timer */}
        <div
        style={{
            position: "relative",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "20px",
            background: `conic-gradient(${colors[mode]} ${progress}%, #f5f5f5 ${progress}%)`
        }}
        >
        {/* Timer Text */}
        <span style={{ position: "absolute" }}>{formatTime(timeLeft)}</span>
        </div>


      {/* Mode Label */}
      <h2 style={{ color: colors[mode], marginBottom: "15px" }}>
        {mode === "work"
          ? "Focus Time"
          : mode === "shortBreak"
          ? "Short Break"
          : "Long Break"}
      </h2>

      {/* Controls */}
      <div>
        <button
          onClick={handleStartPause}
          style={{
            background: colors[mode],
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
            marginRight: "10px",
            color: "#fff"
          }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          style={{
            background: "#ddd",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Reset
        </button>
      </div>

      {/* Cycle Info */}
      <p style={{ marginTop: "20px", fontSize: "0.95rem", color: "#444" }}>
        Completed cycles: {cycleCount} <br />
        Current Pomodoro: {(cycleCount % 4) + 1} of 4
      </p>
    </div>
  );
}

export default FocusMode;
