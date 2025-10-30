import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";

export default function BlockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [unblocking, setUnblocking] = useState(false);
  
  // Get the blocked site from URL params (we'll pass this from the extension)
  const blockedSite = searchParams.get("site") || "this site";
  
  const USER_ID = "12345"; // user id is also here
  const API_URL = `http://localhost:5000/api/blocklist/${USER_ID}`;

  const handleUnblock = async () => {
    if (!window.confirm(`Are you sure you want to unblock ${blockedSite}?`)) {
      return;
    }

    setUnblocking(true);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(blockedSite)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert(`${blockedSite} has been unblocked!`);
        // Redirect back to the site they wanted to visit
        window.location.href = `https://${blockedSite}`;
      } else {
        alert("Failed to unblock site. Please try again.");
      }
    } catch (err) {
      console.error("Error unblocking site:", err);
      alert("Failed to unblock site. Please try again.");
    }
    setUnblocking(false);
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div>
      <div>
        <h1>Remember to stay focused!</h1>
        
        <p><strong>{blockedSite}</strong> has been blocked for the duration of the focus session. You can do it!</p>
        <p>If you need to use this site for your work, you can remove it from the blocklist. It will remain unblocked until you add it back.</p>

        <div>
          <button onClick={handleBackToDashboard}>Return to dashboard</button>
          <button onClick={handleUnblock} disabled={unblocking}>
            {unblocking ? "Unblocking..." : "Unblock site"}
          </button>
        </div>
      </div>
    </div>
  );
}