// pages/Home.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Target, 
  Sparkles, 
  Heart, 
  Clock, 
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import "./Styles/Home.css";

const Home = () => {
  const [activated, setActivated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const loginPage = () => navigate("/login");
  const registerPage = () => navigate("/register");
  const dashboardPage = () => navigate("/dashboard");
  const focusPage = () => navigate("/focus");

  useEffect(() => {
    document.title = "Suraiyya - Home";
  }, []);

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
    window.location.reload();
  };

  const features = [
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Smart productivity chatbot tailored to your needs"
    },
    {
      icon: Target,
      title: "Focus Sessions",
      description: "Distraction-free work with body doubling support"
    },
    {
      icon: Heart,
      title: "Mood Tracking",
      description: "Monitor your emotional well-being daily"
    },
    {
      icon: Lightbulb,
      title: "Idea Management",
      description: "Capture and organize your creative thoughts"
    },
    {
      icon: CheckCircle2,
      title: "Task Management",
      description: "Flexible system that adapts to your workflow"
    },
    {
      icon: Sparkles,
      title: "Gamified Care",
      description: "Make self-care fun and rewarding"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="home-container" onClick={() => setActivated(true)}>
      {/* Floating Background Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* LOGIN / USERNAME DISPLAY */}
      {activated && (
        <motion.div 
          className="auth-buttons"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {user ? (
            <>
              <span className="welcome-text">Hi, {user.name}</span>
              <button onClick={handleLogout} className="auth-btn logout-btn">
                Logout
              </button>
            </>
          ) : null}
        </motion.div>
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
        <motion.img 
          src="s_logo.png" 
          style={{width: "82px", height: "82px", marginTop: "10px"}} 
          alt="logo"
          animate={activated ? {} : { rotate: [0, 5, -5, 0] }}
          transition={{ 
            repeat: activated ? 0 : Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
        />
        <h1 className="home-title">Suraiyya</h1>
      </motion.div>

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
              <motion.div 
                className="hero-text"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="hero-badge">
                  <TrendingUp size={16} />
                  <span>Boost Your Productivity</span>
                </div>
                <h2>Productivity For Desktops</h2>
                <p>
                  Suraiyya aims to create a balanced environment where you can stay productive while
                  also taking care of your mental and emotional well-being.
                </p>
              </motion.div>
              <motion.div 
                className="hero-image"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
              >
                <div className="image-wrapper">
                  <img src={"/home1.jpg"} alt="Startup Illustration" />
                  <div className="image-glow"></div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* FEATURES GRID */}
          <section className="features-section">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="features-header"
            >
              <h2>Everything You Need</h2>
              <p>Comprehensive tools for a productive and balanced life</p>
            </motion.div>
            <motion.div 
              className="features-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="feature-card"
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <div className="feature-icon">
                    <feature.icon size={28} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* HERO SECTION 2 */}
          <section className="info-section">
            <div className="info-grid">
              <motion.div 
                className="info-image"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="image-wrapper">
                  <img src={"/home2.jpg"} alt="Vision" />
                  <div className="image-glow"></div>
                </div>
              </motion.div>
              <motion.div 
                className="info-text"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="info-badge">
                  <Clock size={16} />
                  <span>Work Smarter</span>
                </div>
                <h2>A Guide for All</h2>
                <p>
                  A productivity-focused chatbot, along with mood tracking, focus sessions,
                  body doubling, idea management, flexible task management, and gamified self-care.
                </p>
                <ul className="info-list">
                  <li>
                    <CheckCircle2 size={20} />
                    <span>Personalized productivity insights</span>
                  </li>
                  <li>
                    <CheckCircle2 size={20} />
                    <span>Mental health support built-in</span>
                  </li>
                  <li>
                    <CheckCircle2 size={20} />
                    <span>Flexible to your unique workflow</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </section>

          {/* CALL TO ACTION */}
          <section className="cta-section">
            <motion.div 
              className="cta-content"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {user ? (
                <>
                  <h2>Welcome back, {user.name}</h2>
                  <p>Continue your productivity journey today.</p>
                  <div className="cta-buttons">
                    <motion.button 
                      onClick={dashboardPage} 
                      className="cta-login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Go to Dashboard
                      <ArrowRight size={18} />
                    </motion.button>
                    <motion.button 
                      onClick={focusPage} 
                      className="cta-register"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Focus Session
                      <ArrowRight size={18} />
                    </motion.button>
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
                    <motion.button 
                      onClick={loginPage} 
                      className="cta-login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                      <ArrowRight size={18} />
                    </motion.button>
                    <motion.button 
                      onClick={registerPage} 
                      className="cta-register"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Register
                      <ArrowRight size={18} />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </section>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
