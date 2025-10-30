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

  const moodData = [
    { day: "Mon", mood: 3 },
    { day: "Tue", mood: 4 },
    { day: "Wed", mood: 2 },
    { day: "Thu", mood: 5 },
    { day: "Fri", mood: 4 },
    { day: "Sat", mood: 3 },
    { day: "Sun", mood: 4 },
  ];

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
    navigate("/focus");
  };

  const handleSetting = () => {
    navigate("/settings")
  };

  const handleHome = () => {
    navigate("/")
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
          <li onClick={handleStartFocus}>Focus Session</li>
          <li>Stats</li>
          <li>Planner</li>
          <li onClick={handleSetting}>Settings</li>
          <li onClick={handleHome}>Home</li>
        </ul>
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
            <h3 style={{ marginBottom: "15px", color: "#a7f3d0" }}>
              Mood Tracker
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a7f3d0" />
                <XAxis dataKey="day" tick={{ fill: "#a7f3d0" }} />
                <YAxis domain={[0, 5]} tick={{ fill: "#a7f3d0" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#2d9e69ff"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#6cdfb8ff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
