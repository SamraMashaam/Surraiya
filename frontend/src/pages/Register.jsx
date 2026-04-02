import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles/Register.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Register = () => {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign Up";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      if (res.status === 201) {
        alert("Registration successful!");
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="register-container">
      {/* Left Section - Image */}
      <div
        className="register-left"
        style={{ backgroundImage: "url('/login.jpg')" }}
      >
        <div className="overlay"></div>
      </div>

      {/* Right Section - Form */}
      <div className="register-right">
        <div className="register-form-container">
          <h2 className="register-title">Create an Account</h2>
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                    color: "#e9d5da",
                  }}
                >
                  {showPassword
                    ? <AiOutlineEyeInvisible size={20} />
                    : <AiOutlineEye size={20} />
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="register-button">
              Register
            </button>
          </form>
          <p style={{ fontSize: "0.9rem", color: "#f1dbaa", marginTop: "1rem", textAlign: "center" }}>
            Already have an account? <a href="/login" style={{ color: "#e9d5da" }}>Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;