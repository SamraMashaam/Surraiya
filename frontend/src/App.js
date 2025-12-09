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
import ActivityTracker from "./pages/ActivityTracker";
import VirtualPet from "./pages/VirtualPet";
import ShopPage from "./pages/ShopPage";
import IdeaParkingLot from "./pages/IdeaParkingLot";
import Task from "./pages/Task";


function App() {
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const usr = JSON.parse(stored);
    if (!usr) return;

    const uid = usr.id || usr._id || usr.userId;
    if (!uid) return;

    // Send to extension through content-script bridge
    window.postMessage(
      { type: "USER_ID", userId: uid },
      window.location.origin
    );
  }, []);


  return (
    <>
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
        <Route path="/activity" element={<ActivityTracker />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/idea" element={<IdeaParkingLot />} />
        <Route path="/task" element={<Task />} />
      </Routes>
    </Router>
    <VirtualPet />
    </>
  );
}

export default App;
