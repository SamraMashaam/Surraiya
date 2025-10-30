import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles/Register.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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
        style={{ backgroundImage: "url('/register.png')" }}
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
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="register-button">
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
