/* global chrome, browser */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
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

  useEffect(() => {

    // Also broadcast on page for content-script bridge
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
        const idToCreate = uuidv4();
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
      const amount = Math.round(durationSeconds / 60);
      console.log("amount: ", amount)
      const res = await axios.put(`http://localhost:5000/api/users/${user.id}/currency`, {amount});
      console.log("Currency update: ", res.data.user);

      let stored = JSON.parse(localStorage.getItem("user"));

      stored.currency = res.data.user.currency;

      localStorage.setItem("user", JSON.stringify(stored));
      console.log("Local Currency:", stored.currency);
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
      // After finishing long break cycle, turn off mode
      if (cycleCount + 1 >= 4) {
        setIsRunning(false);
        setCycleCount(0);
        setStartTime(null);
        setMode("off");
        sendNotification("All cycles complete, Great job!"); 
        localStorage.removeItem("activeSessionId");
      } else {
        setMode("work");
        sendNotification("Break over! Back to work.");
      }
      setDuration(workLength * 60);
      setTimeLeft(workLength * 60);
      
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
    // Starting fresh → ensure mode becomes work
    if (mode === "off") {
      setMode("work");
      setDuration(workLength * 60);
      setTimeLeft(workLength * 60);
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
    setMode("off");
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
  }, [user1]);


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

  return (
    <div className="page-wrapper">
      {/* LEFT SIDE - Timer */}
      <div className="focus-container">
        <h1 className="focus-title">Focus Mode</h1>
        <h3>Complete Focus Sessions to earn coins!</h3>
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
      <div className="idea-body">
        <div className="idea-container">
          <h1 className="idea-title">What's The Agenda?</h1>
          <h3 className="idea-title">Complete tasks on time to earn coins!</h3>
          {/* Input Bar */}
          <div className="idea-input-box">
            <textarea
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="I should..."
            />
            <button className="add-btn" onClick={addIdea}>Add Task</button>
          </div>
          {/* Ideas List */}
          <div style={{
            background: '#111827',
            borderRadius: '0.75rem',
            padding: '2rem',
            border: '1px solid #34d399',
            color: 'white'
          }} className="idea-list">
            {ideas.length === 0 ? (
              <p className="empty-msg">No tasks set yet</p>
            ) : (
              ideas.map(idea => (
                <div className="idea-item" key={idea._id}>
                  {editingId === idea._id ? (
                    <>
                      <textarea
                        className="edit-box"
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
                      <p className="idea-text">{idea.text}</p>
                      <div className="idea-actions">
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
