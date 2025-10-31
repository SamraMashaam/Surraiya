// pages/Home.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Styles/Home.css";

const Home = () => {

  const [activated, setActivated] = useState(false);
  const [user, setUser] = useState(null); // tores logged-in user
  const navigate = useNavigate();

  const loginPage = () => navigate("/login");
  const registerPage = () => navigate("/register");
  const dashboardPage = () => navigate("/dashboard");
  const focusPage = () => navigate("/focus");

        useEffect(() => {
      document.title = "Suraiyya - Home";
    }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="home-container" onClick={() => setActivated(true)}>
      {/* LOGIN / USERNAME DISPLAY */}
      {activated && (
        <div className="auth-buttons">
          {user ? (
            <>
              <span className="welcome-text">Hi, {user.name}</span>
              <button onClick={handleLogout} className="auth-btn logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={loginPage} className="auth-btn">
                Login
              </button>
              <button onClick={registerPage} className="auth-btn">
                Register
              </button>
            </>
          )}
        </div>
      )}

      {/* ANIMATED HEADER */}
      <motion.div
        className="home-header"
        initial={
          !activated
            ? { top: "50%", left: "50%", x: "-50%", y: "-50%" }
            : {}
        }
        animate={
          activated
            ? { top: "0.01rem", left: "2rem", x: 0, y: 0, scale: 0.9 }
            : {}
        }
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <img src="s_logo.png" style={{width: "82px", height: "82px", marginTop: "10px"}} alt="logo" />
        <h1 className="home-title">Suraiyya</h1>
      </motion.div>

      {/* NAVBAR */}
      {activated && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="navbar"
        >
          <nav className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/focus" target="_blank" className="nav-link">Focus Mode</a>
            <a href="/help" className="nav-link">Help</a>
          </nav>
        </motion.div>
      )}

      {/* MAIN CONTENT */}
      {activated && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="home-main"
        >
          {/* HERO SECTION 1 */}
          <section className="hero-section">
            <div className="hero-grid">
              <div className="hero-text">
                <h2>Productivity For Desktops</h2>
                <p>
                  Suraiyya aims to create a balanced environment where you can stay productive while
                  also taking care of your mental and emotional well-being.
                </p>
              </div>
              <div className="hero-image">
                <img src={"/home1.jpg"} alt="Startup Illustration" />
              </div>
            </div>
          </section>

          {/* HERO SECTION 2 */}
          <section className="info-section">
            <div className="info-grid">
              <div className="info-image">
                <img src={"/home2.jpg"} alt="Vision" />
              </div>
              <div className="info-text">
                <h2>A Guide for All</h2>
                <p>
                  A productivity-focused chatbot, along with mood tracking, focus sessions,
                  body doubling, idea management, flexible task management, and gamified self-care.
                </p>
              </div>
            </div>
          </section>

          {/* CALL TO ACTION */}
          <section className="cta-section">
            <div className="cta-content">
              {user ? (
                <>
                  <h2>Welcome back, {user.name}</h2>
                  <p>Continue your productivity journey today.</p>
                  <div className="cta-buttons">
                    <button onClick={dashboardPage} className="cta-login">Go to Dashboard</button>
                    <button onClick={focusPage} className="cta-register">Start Focus Session</button>
                  </div>
                </>
              ) : (
                <>
                  <h2>Productivity should not come at the cost of mental health</h2>
                  <p>
                    Want a distraction-free work environment with emotional support and encouragement?
                    Get started today!
                  </p>
                  <div className="cta-buttons">
                    <button onClick={loginPage} className="cta-login">Login</button>
                    <button onClick={registerPage} className="cta-register">Register</button>
                  </div>
                </>
              )}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
