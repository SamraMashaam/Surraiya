import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Styles/BlockPage.css";

export default function BlockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [unblocking, setUnblocking] = useState(false);
  const [user, setUser] = useState(null);

  const blockedSite = searchParams.get("site") || "this site";

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const API_URL = user
    ? `${process.env.REACT_APP_API_URL}/api/blocklist/${user.id || user._id || user.userId}`
    : null;

  const handleUnblock = async () => {
    if (!window.confirm(`Are you sure you want to unblock ${blockedSite}?`)) {
      return;
    }

    if (!API_URL) {
      alert("User session not found. Please log in.");
      return;
    }

    setUnblocking(true);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(blockedSite)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert(`${blockedSite} has been unblocked!`);
        window.location.href = `https://${blockedSite}`;
      } else {
        alert("Failed to unblock site. Please try again.");
      }
    } catch (err) {
      alert("Failed to unblock site. Please try again.");
    }
    setUnblocking(false);
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="block-page">
      <div className="block-card">
        <svg
          className="block-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>

        <h1 className="block-heading">Remember to stay focused!</h1>

        <p className="block-text">
          <strong className="block-site-name">{blockedSite}</strong> has been blocked for the duration of the focus session. You can do it!
        </p>
        <p className="block-text">
          If you need to use this site for your work, you can remove it from the blocklist. It will remain unblocked until you add it back.
        </p>

        <div className="block-actions">
          <button className="btn-secondary" onClick={handleBackToDashboard}>
            Return to dashboard
          </button>
          <button
            className="btn-primary"
            onClick={handleUnblock}
            disabled={unblocking}
          >
            {unblocking ? "Unblocking..." : "Unblock site"}
          </button>
        </div>
      </div>
    </div>
  );
}
