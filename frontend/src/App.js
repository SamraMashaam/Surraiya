/* global chrome, browser */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DashBoard from "./pages/DashBoard";
import FocusMode from "./pages/FocusMode";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import FriendsPage from "./pages/FriendsPage";
import ProfilePage from "./pages/ProfilePage";
import TherapyChatbot from "./pages/TherapyChatbot";

function App() {
  const [pet, setPet] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const loadUserPet = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        setUser(null);
        setPet(null);
        return null;
      }

      const userRes = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
      const currentUser = userRes.data;
      setUser(currentUser);

      console.log("Current user:", currentUser); 

      if (!currentUser.petID) {
        console.log("No petID found"); 
        return null;
      }

      const petRes = await axios.get(`http://localhost:5000/api/pets/${currentUser.petID._id}`);
      console.log("Loaded pet:", petRes.data); 
      setPet(petRes.data);
    } catch (err) {
       console.error(err);
    }
  }

  // Load user and pet once at app level
  useEffect(() => {
    loadUserPet();
  }, []);

  const refreshUser = () => {
    loadUserPet(); // Re-fetch the user data
  };

  return (
    <>
    <StarField />
    <VirtualPet pet={pet} user={user}/>
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashBoard refreshUser={refreshUser}/>} />
        <Route path="/" element={<Home />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/Login" element={<Login refreshUser={refreshUser}/>} />
        <Route path="/Register" element={<Register />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<InstructionsPage />} />
        <Route path="/activity" element={<ActivityTracker />} />
        <Route path="/shop" element={<ShopPage  pet={pet} setPet={setPet} user={user} setUser={setUser}  />} />
        <Route path="/idea" element={<IdeaParkingLot />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/video" element={<VideoCall user={user} />} />
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/friends" element={<FriendsPage user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} refreshUser={refreshUser}/>} />
        <Route path="/mira" element={<TherapyChatbot />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
