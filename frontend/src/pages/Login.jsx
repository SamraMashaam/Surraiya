// pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Styles/Login.css";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

function Login({refreshUser}) {
  useEffect(() => {
    document.title = "Login";
  }, []);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, formData);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.postMessage({
        type: "USER_ID",
        userId: user.id || user._id
      });
      if (refreshUser) {
        await refreshUser();
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SECTION */}
      <div className="login-left">
        <h2 className="login-title">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              name="username"
              type="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "#A0AEC0",
                }}
              >
                {showPassword
                  ? <AiOutlineEyeInvisible size={20} />
                  : <AiOutlineEye size={20} />
                }
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <p style={{ fontSize: "0.9rem", color: "#A0AEC0", marginTop: "1rem" }}>
          Don't have an account? <a href="/register" style={{ color: "#6EE7B7" }}>Sign up today</a>
        </p>
      </div>

      {/* RIGHT IMAGE SECTION */}
      <div className="login-right" style={{ backgroundImage: "url('/login.jpg')" }}>
        <div className="overlay"></div>
      </div>
    </div>
  );
}

export default Login;