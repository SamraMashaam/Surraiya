/* global chrome */
import React, { useState, useEffect } from "react";
import "./Styles/Activity.css"; 

// Hardcode your extension ID here
const EXTENSION_ID = "cmjokoeadcibfoihhnfbjaphpllfbcnk"; // <-- IMPORTANT: PASTE YOUR ID HERE

function ActivityTracker() {
    useEffect(() => {
    document.title = "Activity Tracker";
  }, []);

  const [error, setError] = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [inactivityThreshold, setInactivityThreshold] = useState(1);
  const [tempThreshold, setTempThreshold] = useState(1);


  const sendMessageToExtension = (message) => {
    return new Promise((resolve) => {
      window.postMessage(
        { type: "ACTIVITY_MSG", payload: message },
        "*"
      );

      // Listen for a response from extension
      const listener = (event) => {
        if (event.data?.type === "ACTIVITY_REPLY") {
          window.removeEventListener("message", listener);
          resolve(event.data.response);
        }
      };

      window.addEventListener("message", listener);
    });
  };


  const startSession = async () => {
    try {
      const response = await sendMessageToExtension({ action: 'startSession', threshold: inactivityThreshold });
      if (response && response.success) {
        setSessionActive(true);
        setError("");
      } else {
        setError("Failed to start session in extension");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const stopSession = async () => {
    try {
      const response = await sendMessageToExtension({ action: 'stopSession' });
      if (response && response.success) {
        setSessionActive(false);
      } else {
        setError("Failed to stop session in extension");
      }
    } catch (err) {
      console.error("Failed to stop session:", err);
    }
  };

  const updateThreshold = async () => {
    if (tempThreshold < 1 || tempThreshold > 60) {
      setError("Threshold must be between 1 and 60 minutes");
      return;
    }
    try {
      const response = await sendMessageToExtension({ action: 'updateThreshold', threshold: tempThreshold });
      if (response && response.success) {
        setInactivityThreshold(tempThreshold);
        setError("");
        alert(`Inactivity threshold updated to ${tempThreshold} minutes`);
      } else {
        setError("Failed to update threshold in extension");
      }
    } catch (err) {
      console.error("Failed to update threshold:", err);
    }
  };
  
  return (
    <div className="blocker-container">
      <div className="settings-panel">
        
        <div className="blocker-header">
           <img src="s_logo.png" style={{width: "90px", height: "90px", marginTop: "10px"}} alt="logo" />
          <h1 className="blocker-title">Distraction Blocker</h1>
          <p className="blocker-subtitle">Keep this tab open and stay focused with activity tracking</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            ⚠️ {error}
          </div>
        )}

        {/* Session Control */}
        <div className="settings-card">
          <h2>Focus Session</h2>
          <div className="flex-container">
            <div>
              <strong>Status:</strong>{" "}
              <span className={`status-text ${sessionActive ? 'status-active' : 'status-inactive'}`}>
                {sessionActive ? "🟢 ACTIVE" : "⚫ INACTIVE"}
              </span>
            </div>
            {sessionActive ? (
              <button onClick={stopSession} className="btn btn-stop">Stop Session</button>
            ) : (
              <button onClick={startSession} className="btn btn-start">Start Session</button>
            )}
          </div>
        </div>

        {/* Inactivity Settings */}
        <div className="settings-card">
          <h2>Inactivity Alert</h2>
          <p>Get notified if you're inactive for too long during a focus session.</p>
          <div className="flex-container">
            <label>Alert after:</label>
            <input
              type="number"
              min="1" max="60"
              value={tempThreshold}
              onChange={(e) => setTempThreshold(parseInt(e.target.value))}
              className="form-input-number"
            />
            <span>minutes</span>
            <button
              onClick={updateThreshold}
              disabled={tempThreshold === inactivityThreshold}
              className="btn btn-update"
            >
              Update
            </button>
          </div>
        </div>
        </div>
        </div>
  );
}

export default ActivityTracker;