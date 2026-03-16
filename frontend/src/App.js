/* global chrome, browser */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
import MoodPage from "./pages/MoodPage";
import StarField from "./pages/StarField";
import VideoCall from "./pages/VideoCall";
import Chat from "./pages/Chat";


function App() {
  const [pet, setPet] = useState(null);
  const [user, setUser] = useState(null);
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


  // Load user and pet once at app level
useEffect(() => {
  async function loadUserPet() {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) return;

      const userRes = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
      const currentUser = userRes.data;
      setUser(currentUser);

      console.log("Current user:", currentUser); 

      if (!currentUser.petID) {
        console.log("No petID found"); 
        return;
      }

      const petRes = await axios.get(`http://localhost:5000/api/pets/${currentUser.petID._id}`);
      console.log("Loaded pet:", petRes.data); 
      setPet(petRes.data);
    } catch (err) {
      console.error(err);
    }
  }
  loadUserPet();
}, []);

  return (
    <>
    <StarField />
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
        <Route path="/shop" element={<ShopPage  pet={pet} setPet={setPet} user={user} setUser={setUser}  />} />
        <Route path="/idea" element={<IdeaParkingLot />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/video" element={<VideoCall user={user} />} />
        <Route path="/chat" element={<Chat user={user} />} />
      </Routes>
    </Router>
    <VirtualPet pet={pet} user={user}/>
    </>
  );
}

export default App;
