import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Styles/Settings.css"; 

export default function SettingsPage() {

  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [API_URL, setAPI_URL] = useState(null);

        useEffect(() => {
      document.title = "Settings";
    }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
        setUser(res.data);

        const id = res.data.id || res.data._id || res.data.userId;
        window.postMessage({
          type: "USER_ID",
          userId: storedUser.id
        });

        setAPI_URL(`http://localhost:5000/api/blocklist/${id}`);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (API_URL) fetchBlockedSites();
  }, [API_URL]);

  const fetchBlockedSites = async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setBlockedSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch blocked sites:", err);
      setBlockedSites([]);
      setError("Failed to load blocked sites.");
    }
    setLoading(false);
  };

  const triggerExtensionSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1000);
  };

  const handleInputChange = (e) => {
    setNewSite(e.target.value);
    setError("");
  };

  const addSite = async (e) => {
    e.preventDefault();
    setError("");

    if (!newSite.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: newSite })
      });

      if (res.ok) {
        setNewSite("");
        await fetchBlockedSites();
        triggerExtensionSync();
      } else {
        setError("Failed to add site");
      }
    } catch (err) {
      setError("Failed to add site");
    }
    setLoading(false);
  };

  const removeSite = async (site) => {
    if (!window.confirm(`Remove ${site}?`)) return;

    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(site)}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBlockedSites();
        triggerExtensionSync();
      }
    } catch (err) {
      setError("Failed to remove site");
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-box">
        <div className="settings-header">
          <h1>Website Blocklist Settings</h1>
          <button onClick={() => navigate("/dashboard")} className="back-btn">Dashboard</button>
          <button onClick={() => navigate("/help")} className="back-btn">Instructions</button>
        </div>

        <p className="desc-text">Add websites you want to block</p>
        <p className="desc-text">Use only their domain names (example: youtube.com)</p>

        {syncing && <div className="sync-banner">Syncing with extension...</div>}

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={addSite} className="add-form">
          <input
            type="text"
            value={newSite}
            onChange={handleInputChange}
            placeholder="e.g., youtube.com"
            className="site-input"
          />
          <button
            type="submit"
            disabled={loading || !newSite.trim()}
            className="add-btn"
          >
            {loading ? "Adding..." : "Add Site"}
          </button>
        </form>

        <div>
          <h2 className="blocked-title">Blocked Sites ({blockedSites.length})</h2>

          {loading && blockedSites.length === 0 ? (
            <p className="loading-text">Loading...</p>
          ) : blockedSites.length === 0 ? (
            <div className="empty-box">
              <p>No sites blocked yet. Add one above.</p>
            </div>
          ) : (
            <ul className="site-list">
              {blockedSites.map((site, index) => (
                <li key={index} className="site-item">
                  <span>{site}</span>
                  <button className="remove-btn" onClick={() => removeSite(site)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
