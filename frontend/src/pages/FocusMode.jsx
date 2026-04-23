/* global chrome, browser */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Styles/FocusMode.css";
import { useNavigate } from "react-router-dom";

function FocusMode() {
  useEffect(() => {
    document.title = "Focus Mode";
  }, []);
  
  // --- Load saved state if exists ---
  const saved = JSON.parse(localStorage.getItem("focusTimerState"));
  const [workLength, setWorkLength] = useState(saved?.workLength || 25);
  const [shortBreakLength, setShortBreakLength] = useState(saved?.shortBreakLength || 5);
  const [longBreakLength, setLongBreakLength] = useState(saved?.longBreakLength || 15);
  const [mode, setMode] = useState(saved?.mode || "off");
  const [isRunning, setIsRunning] = useState(saved?.isRunning || false);
  const [cycleCount, setCycleCount] = useState(saved?.cycleCount || 0);
  const [startTime, setStartTime] = useState(saved?.startTime ? new Date(saved.startTime) : null);
  const [duration, setDuration] = useState(saved?.duration || workLength * 60);
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!saved?.startTime) return duration;
    const elapsed = (Date.now() - new Date(saved.startTime)) / 1000;
    return Math.max(saved.duration - elapsed, 0);
  });
  const [pausedTime, setPausedTime] = useState(null);
  const storedU = localStorage.getItem("user");
  const [user, setUser] = useState(storedU || null);

  const timerRef = useRef(null);
  const notificationsSent = useRef({ fifty: false, ninety: false });

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

  useEffect(() => {
    // Broadcast on page for content-script bridge
    window.postMessage(
      { type: "FOCUS_MODE", mode },
      window.location.origin
    );
  }, [mode]);

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

      const progressPercent = ((duration - remaining) / duration) * 100;
      if (mode === "work") {
        // 50% notification
        if (progressPercent >= 50 && !notificationsSent.current.fifty) {
          sendProgressNotification(50);
          notificationsSent.current.fifty = true;
        }
        
        // 90% notification
        if (progressPercent >= 90 && !notificationsSent.current.ninety) {
          sendProgressNotification(90);
          notificationsSent.current.ninety = true;
        }
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleSessionEnd();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning, startTime, duration]);

  // --- DB sync every minute ---
  useEffect(() => {
    if (!isRunning || mode !== "work") return; // Only track work sessions
    
    const interval = setInterval(async () => {
      await updateSessionInDB();
    }, 60000); // Every 60 seconds
    
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  // NEW: Start session in DB
  const startSessionInDB = async () => {
    if (!user) return;
    const resolvedUserId = user.id || user._id || user.userId;

    if (!resolvedUserId) {
      console.error("startSessionInDB: could not resolve userId from user object:", user);
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/focus/user/${resolvedUserId}/start`);
      console.log("Session started in DB:", res.data);
    } catch (err) {
      console.error("Error starting session:", err);
    }
  };

  // NEW: Update session in DB (called every minute)
  const updateSessionInDB = async () => {
    if (!user) return;
    const resolvedUserId = user.id || user._id || user.userId;

    if (!resolvedUserId) {
      console.error("updateSessionInDB: could not resolve userId");
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/focus/user/${resolvedUserId}/update`);
      console.log("Session updated (duration +1):", res.data);

      // Update currency (1 coin per minute of work)
      if (mode === "work") {
        const amount = 1;
        const currencyRes = await axios.put(`http://localhost:5000/api/users/${resolvedUserId}/currency`, { amount });
        console.log("Currency update:", currencyRes.data.user);

        let stored = JSON.parse(localStorage.getItem("user"));
        stored.currency = currencyRes.data.user.currency;
        localStorage.setItem("user", JSON.stringify(stored));
      }
    } catch (err) {
      console.error("DB update error:", err);
    }
  };

  // NEW: End session in DB
  const endSessionInDB = async () => {
    if (!user) return;
    const resolvedUserId = user.id || user._id || user.userId;

    if (!resolvedUserId) {
      console.error("endSessionInDB: could not resolve userId");
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/focus/user/${resolvedUserId}/end`);
      console.log("Session ended in DB:", res.data);
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  const sendNotification = (msg) => {
    if (Notification.permission === "granted") {
      new Notification("Focus Mode", { body: msg });
    } else {
      alert(msg);
    }
  };

  const sendProgressNotification = (percentage) => {
    let message = "";
    
    if (percentage === 50) {
      const messages = [
        "Halfway there! You're doing amazing!",
        "50% complete! Keep up the great work!",
        "You're crushing it! Halfway done!",
        "Nice progress! You're halfway through!",
        "Keep that momentum going! Half done!"
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    } else if (percentage === 90) {
      const messages = [
        "Almost there! Just a few more minutes!",
        "90% done! You've got this!",
        "Final stretch! Stay focused!",
        "So close! Finish strong!",
        "Nearly complete! Keep pushing!"
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    }
    
    if (message) {
      sendNotification(message);
    }
  };

  const handleSessionEnd = async () => {
    await endSessionInDB(); // Mark session as inactive
    
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
      
      // Auto-start the break timer
      const now = new Date();
      setStartTime(now);
      setIsRunning(true);
      await startSessionInDB();
      
    } else {
      // Break ended, auto-start next work session
      sendNotification("Break complete! Starting next focus session.");
      setMode("work");
      setDuration(workLength * 60);
      setTimeLeft(workLength * 60);
      notificationsSent.current = { fifty: false, ninety: false };
      
      // Auto-start the work timer
      const now = new Date();
      setStartTime(now);
      setIsRunning(true);
      await startSessionInDB();
    }
  };

  const handleStartPause = async () => {
    if (isRunning) {
      // PAUSE
      clearInterval(timerRef.current);
      setIsRunning(false);
      setPausedTime(timeLeft);
      
      // End session in DB when paused
      await endSessionInDB();
      return;
    }

    // --- START or RESUME ---
    const now = new Date();
    
    // Starting fresh → ensure mode becomes work
    if (mode === "off") {
      setMode("work");
      setDuration(workLength * 60);
      setTimeLeft(workLength * 60);
      setStartTime(now);
      notificationsSent.current = { fifty: false, ninety: false };
      
      // Start new session in DB
      await startSessionInDB();
    } else if (pausedTime !== null) {
      // RESUME from pause
      const elapsed = duration - pausedTime; 
      const newStartTime = new Date(now.getTime() - elapsed * 1000);
      setStartTime(newStartTime);
      setPausedTime(null);
      
      // Restart session in DB
      await startSessionInDB();
    } else {
      // Just starting the timer
      setStartTime(now);
      
      // Start session in DB
      await startSessionInDB();
    }
    
    setIsRunning(true);
  };

  const handleReset = async () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setMode("off");
    setCycleCount(0);
    setDuration(workLength * 60);
    setTimeLeft(workLength * 60);
    setStartTime(null);
    setPausedTime(null);
    notificationsSent.current = { fifty: false, ninety: false };
    
    // End session in DB
    await endSessionInDB();
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
    setMode("off");
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
    off: "#e78888ff",
    work: "#a8dadc",
    shortBreak: "#abb3fbff",
    longBreak: "#c9b4dbff",
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  const user1 = JSON.parse(localStorage.getItem("user"));
  useEffect(() => {
    if (!user1) {
      navigate("/login");
      return;
    }

    async function loadIdeas() {
      try {
        const res = await axios.get(`http://localhost:5000/api/tasks/${user1.id}`);
        setIdeas(res.data.tasks);
      } catch (err) {
        console.error(err);
      }
    }

    loadIdeas();
  }, [user1?.id]); 

  async function addIdea() {
    if (newIdea.trim() === "") return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        userId: user1.id,
        text: newIdea
      });

      setIdeas(prev => [res.data.task, ...prev]);
      setNewIdea("");
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteIdea(id) {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      setIdeas(prev => prev.filter(i => i._id !== id));
      const amount = 5;
      console.log("amount: ", amount)
      const res = await axios.put(`http://localhost:5000/api/users/${user1.id}/currency`, {amount});
      console.log("task Currency update: ", res.data.user);
    
      let stored = JSON.parse(localStorage.getItem("user"));
  
      stored.currency = res.data.user.currency;
    
      localStorage.setItem("user", JSON.stringify(stored));
      console.log("Local task Currency:", stored.currency);
    } catch (err) {
      console.error(err);
    }
  }

  function startEditing(idea) {
    setEditingId(idea._id);
    setEditingText(idea.text);
  }

  async function saveEdit() {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/tasks/${editingId}`,
        { text: editingText }
      );

      setIdeas(prev =>
        prev.map(i => (i._id === editingId ? res.data.task : i))
      );

      setEditingId(null);
      setEditingText("");
    } catch (err) {
      console.error(err);
    }
  }

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="page-wrapper">
      {/* LEFT SIDE - Timer */}
      <div className="focus-container">
        <h1 className="focus-title">Focus Mode</h1>
        <p>Keep this tab open while you work</p>
        <p>Complete Focus Sessions to earn coins!</p>
        <button className="setting-btn" onClick={(handleSettings)}>
          Block Distracting Sites
        </button>
        <div className="settings-cardf">
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
          {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : 
          mode === "longBreak" ? "Long Break" : "Timer Off"}
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

      {/* RIGHT SIDE - Tasks */}
      <div className="task-body">
        <div className="task-container">
          <h1 className="task-title">What's The Agenda?</h1>
          <h3 className="task-title">Complete tasks on time to earn coins!</h3>
          {/* Input Bar */}
          <div className="task-input-box">
            <textarea
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="I should..."
            />
            <button className="add-btn" onClick={addIdea}>Add Task</button>
          </div>
          {/* Ideas List */}
          <div className="task-list">
            {ideas.length === 0 ? (
              <p className="empty-msg">No tasks set yet</p>
            ) : (
              ideas.map(idea => (
                <div className="task-item"  key={idea._id}>
                  {editingId === idea._id ? (
                    <>
                      <textarea
                        className="edit-box"
                        style={{
                          width: '95%'
                        }}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <button className="save-btn" onClick={saveEdit}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="task-text">{idea.text}</p>
                      <div className="task-actions">
                        <button className="edit-btn" onClick={() => startEditing(idea)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => deleteIdea(idea._id)}>
                          Task Complete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FocusMode;
