import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Styles/DashBoard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function DashBoard() {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [moodGraphData, setMoodGraphData] = useState([]); // State for graph data

  const fallbackData = [
    { day: "Mon", mood: 0 },
    { day: "Tue", mood: 0 },
    { day: "Wed", mood: 0 },
    { day: "Thu", mood: 0 },
    { day: "Fri", mood: 0 },
    { day: "Sat", mood: 0 },
    { day: "Sun", mood: 0 },
  ];

  useEffect(() => {
      document.title = "Dashboard";
    }, []);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }

    // Fetch latest data from backend
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
        setUser(res.data);
        const userData = res.data;

        if (userData.moodLog && userData.moodLog.length > 0) {
          // 1. Sort entries by date (Oldest -> Newest)
          const sortedLog = [...userData.moodLog].sort((a, b) => new Date(a.date) - new Date(b.date));

          // 2. Take the last 7 entries (so the graph doesn't get overcrowded)
          const recentEntries = sortedLog.slice(-7);

          // 3. Map to Recharts format
          const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          
          const processedData = recentEntries.map((entry) => {
            const dateObj = new Date(entry.date);
            return {
              day: daysOfWeek[dateObj.getDay()], // Converts date to "Mon", "Tue"...
              mood: entry.score || 3, // Use the score we added to the model (default to 3 if missing)
            };
          });

          setMoodGraphData(processedData);
        } else {
          setMoodGraphData([]); // No data found
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleStartFocus = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notifications enabled");
        } else {
          console.log("Notifications denied");
        }
      });
    }
    window.open("/focus", "_blank");

  };

  const handleSetting = () => {
    navigate("/settings")
  };

  const handleHome = () => {
    navigate("/")
  };
  const handleTracker = () => {
    navigate("/activity")
  };
  const handleShop = () => {
    navigate("/shop")
  };
  const handleIdea = () => {
    navigate("/idea")
  };
  const handleMood = () => {
    navigate("/mood")
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile">
          <img
            src={user.profilePic || "home.jpg"}
            alt="User"
            className="profile-img"
          />
          <h2 className="profile-name">{user.userName}</h2>
        </div>
        <ul className="menu">
          <li onClick={handleStartFocus}>Focus Mode</li>
          <li onClick={handleTracker}>Activity Tracker</li>
          <li onClick={handleShop}>Pet Shop</li>
          <li onClick={handleIdea}>Idea Parking Lot</li>
          <li onClick={handleMood}>Mood Journal</li>
          <li onClick={handleSetting}>Settings</li>
          <li onClick={handleHome}>Home</li>
        </ul>
        <img src="s_logo.png" style={{width: "90px", height: "90px", marginTop: "10px"}} alt="logo" />
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="welcome">Welcome back, {user.userName}</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Focus Sessions</h3>
            <p>{user.FSessionCount || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Time</h3>
            <p>8h 30m</p>
          </div>

          <div className="mood-graph">
            <h3 style={{ marginBottom: "15px", color: "#f1dbaa" }}>
              Mood Tracker
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart 
                data={moodGraphData.length > 0 ? moodGraphData : fallbackData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1dbaa" />
                <XAxis dataKey="day" tick={{ fill: "#f1dbaa" }} />
                <YAxis domain={[0, 5]} tick={{ fill: "#f1dbaa" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#827397"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f1dbaa" }}
                  
                />
              </LineChart>
            </ResponsiveContainer>
            {/* Helper text if no data exists */}
            {moodGraphData.length === 0 && (
              <p style={{ textAlign: "center", color: "#f3e8a7", fontSize: "0.8rem", marginTop: "10px" }}>
                No mood entries yet. Go to Mood Journal to start!
              </p> )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
