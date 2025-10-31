// pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Styles/Login.css";
import axios from "axios";

function Login() {
      useEffect(() => {
      document.title = "Login";
    }, []);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      const { token, user } = res.data;

      // Store token + user info locally
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.postMessage({
        type: "USER_ID",
        userId: user.id || user._id
      });
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
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>

      {/* RIGHT IMAGE SECTION */}
      <div className="login-right" style={{ backgroundImage: "url('/login.png')" }}>
        <div className="overlay"></div>
      </div>
    </div>
  );
}

export default Login;
