import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Play, Square, Clock, TrendingUp, AlertCircle, Zap } from "lucide-react";
import "./Styles/Activity.css";

function ActivityTracker() {
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [error, setError] = useState("");
  const [lastActive, setLastActive] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  
  const timerRef = useRef(null);
  const idleCheckRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser ? (storedUser.id || storedUser._id) : null;

  useEffect(() => {
    document.title = "Activity Tracker";
    if (userId) fetchTotalDuration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTotalDuration = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/focus/user/${userId}/total`
      );
      setTotalDuration(res.data.totalDuration || 0);
    } catch (err) {
      console.error("Failed to fetch total duration:", err);
    }
  };

  const startSession = async () => {
    if (!userId) {
      setError("Please log in to track your activity");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/focus/user/${userId}/start`
      );
      setSessionActive(true);
      setElapsedTime(0);
      setError("");
      setLastActive(Date.now());
      setIsIdle(false);
      setIdleTime(0);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to start session. Please try again.");
    }
  };

  const stopSession = async () => {
    if (!userId) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/focus/user/${userId}/end`
      );
      setSessionActive(false);
      setElapsedTime(0);
      setIsIdle(false);
      setIdleTime(0);
      fetchTotalDuration();
    } catch (err) {
      console.error("Failed to end session:", err);
      setError("Failed to end session. Please try again.");
    }
  };

  useEffect(() => {
    if (sessionActive && !isIdle) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [sessionActive, isIdle]);

  const IDLE_THRESHOLD = 60000;

  const resetIdleTimer = useCallback(() => {
    if (isIdle && sessionActive) {
      setIsIdle(false);
      setIdleTime(0);
    }
    setLastActive(Date.now());
  }, [isIdle, sessionActive]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    const handleActivity = () => resetIdleTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!sessionActive) return;

    idleCheckRef.current = setInterval(() => {
      const timeSinceActive = Date.now() - lastActive;
      if (timeSinceActive > IDLE_THRESHOLD && !isIdle) {
        setIsIdle(true);
      }
      if (isIdle) {
        setIdleTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(idleCheckRef.current);
  }, [sessionActive, lastActive, isIdle]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <div className="activity-container">
      <div className="activity-wrapper">
        <div className="activity-header">
          <Zap size={32} className="activity-icon" />
          <h1>Activity Tracker</h1>
          <p>Track your focus time and stay productive</p>
        </div>

        {error && (
          <div className="activity-alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="activity-stats-grid">
          <div className="activity-stat-card">
            <Clock size={24} />
            <div className="stat-info">
              <span className="stat-value">{formatMinutes(totalDuration)}</span>
              <span className="stat-label">Total Focus Time</span>
            </div>
          </div>

          <div className="activity-stat-card">
            <TrendingUp size={24} />
            <div className="stat-info">
              <span className="stat-value">{formatTime(elapsedTime)}</span>
              <span className="stat-label">Current Session</span>
            </div>
          </div>
        </div>

        <div className={`activity-timer-card ${sessionActive ? (isIdle ? 'idle' : 'active') : ''}`}>
          <div className="timer-display">
            {formatTime(elapsedTime)}
          </div>

          {isIdle && sessionActive && (
            <div className="idle-warning">
              <AlertCircle size={18} />
              Idle for {formatTime(idleTime)} - move your mouse or press a key to continue
            </div>
          )}

          <div className="timer-controls">
            {!sessionActive ? (
              <button onClick={startSession} className="timer-btn start">
                <Play size={20} />
                Start Tracking
              </button>
            ) : (
              <button onClick={stopSession} className="timer-btn stop">
                <Square size={20} />
                Stop Tracking
              </button>
            )}
          </div>
        </div>

        <div className="activity-info">
          <p>
            This tracker measures your active focus time. It will detect when you go idle 
            (no mouse or keyboard activity for 60 seconds) and pause the timer automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActivityTracker;
