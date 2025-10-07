import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function HomePage() {
  const navigate = useNavigate();

    // Example mood data
  const moodData = [
    { day: "Mon", mood: 3 },
    { day: "Tue", mood: 4 },
    { day: "Wed", mood: 2 },
    { day: "Thu", mood: 5 },
    { day: "Fri", mood: 4 },
    { day: "Sat", mood: 3 },
    { day: "Sun", mood: 4 },
  ];

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

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile">
          <img
            src="https://via.placeholder.com/100"
            alt="User"
            className="profile-img"
          />
          <h2 className="profile-name">John Doe</h2>
        </div>
        <ul className="menu">
          <li onClick={handleStartFocus}>🎯 Focus Session</li>
          <li>📊 Stats</li>
          <li>📅 Planner</li>
          <li>⚙️ Settings</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="welcome">Welcome back, John 👋</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Focus Sessions</h3>
            <p>12</p>
          </div>
          <div className="stat-card">
            <h3>Total Time</h3>
            <p>8h 30m</p>
          </div>
          {/* Mood Graph */}
      <div className="mood-graph">
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Mood Tracker</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={moodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#fbc4ab"
              strokeWidth={3}
              dot={{ r: 5, fill: "#f4978e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
