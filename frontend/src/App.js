/* global chrome, browser */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import DashBoard from "./pages/DashBoard";
import FocusMode from "./pages/FocusMode";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BlockPage from "./pages/BlockPage";
import SettingsPage from "./pages/SettingsPage";
import InstructionsPage from "./pages/InstructionsPage";


function App() {
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const usr = JSON.parse(stored);
    if (!usr) return;

    const uid = usr.id || usr._id || usr.userId;
    if (!uid) return;

    // Send to Chrome
    if (window.chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: "SET_USER_ID", userId: uid }, () => {});
    }

    // Send to Firefox bridge
    window.postMessage({ type: "USER_ID", userId: uid }, window.location.origin);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/" element={<Home />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/blocked" element={<BlockPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<InstructionsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
