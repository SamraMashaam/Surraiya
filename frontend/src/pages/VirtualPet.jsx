import React, { useEffect, useState } from "react";
import "./Styles/VirtualPet.css";
import axios from "axios";
import { Lock, LockOpen } from 'lucide-react';

export default function VirtualPet({ pet, user }) {
  console.log("VirtualPet received pet:", pet);
  const [petTypes, setPetTypes] = useState(null);
  const [sparkle, setSparkle] = useState(false);
  const [petVisible, setPetVisible] = useState(true);
  
  // Draggable state
  const [isDraggable, setIsDraggable] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("petPosition");
    return saved ? JSON.parse(saved) : { 
      x: window.innerWidth - 220, 
      y: window.innerHeight - 220 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/pets/petTypes.json")
      .then(res => res.json())
      .then(data => setPetTypes(data))
      .catch(err => console.error(err));
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem("petPosition", JSON.stringify(position));
  }, [position]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const navLinkStyle = {
    color: "#f1dbaa",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  };
  

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!petTypes) return null;
  if(!user) return(
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "55px",
        background: "#2e2952",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxSizing: "border-box",
        zIndex: 1001,
        boxShadow: "0 2px 5px rgb(241, 219, 170)"
      }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <a href="/" style={navLinkStyle}>Home</a>
          <a href="/login" style={navLinkStyle}>Login</a>
          <a href="/register" style={navLinkStyle}>Sign Up</a>
          <a href="/mira" style={navLinkStyle}>Mira</a>
        </div>
      </nav>
    </>
  );
  if (!pet) return (
    <>
      <nav style={{
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "55px",
  background: "#2e2952",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  boxSizing: "border-box",
  zIndex: 1001,
  boxShadow: "0 1px 5px rgb(241, 219, 170)"
}}>
  <div style={{ display: "flex", gap: "20px" }}>
    <a href="/" style={navLinkStyle}>Home</a>
    <a href="/dashboard" style={navLinkStyle}>Dashboard</a>
    <a href="/shop" style={navLinkStyle}>Pet Shop</a>
    <a href="/focus" target="_blank" rel="noopener noreferrer" style={navLinkStyle}>Focus Mode</a>
    <a href="/activity" target="_blank" rel="noopener noreferrer" style={navLinkStyle}>Activity Tracker</a>
    <a href="/mood" style={navLinkStyle}>Mood Journal</a>
    <a href="/mira" style={navLinkStyle}>Mira</a>
    <a href="/help" style={navLinkStyle}>Distraction Blocker</a>
  </div>

  <a
    href="/profile"
    title="Profile"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: "#f1dbaa",
      textDecoration: "none",
      fontSize: "0.9rem",
      fontWeight: "500",
      padding: "4px 10px",
      borderRadius: "20px",
      border: "1px solid #827397",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "#827397";
      e.currentTarget.style.borderColor = "#f1dbaa";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.borderColor = "#827397";
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f1dbaa"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
    Profile
  </a>
</nav>
    </>
  );

  const typeMeta = petTypes[pet.petType];
  if (!typeMeta) return null;

  const containerSize = {
    width: typeMeta.width || 200,
    height: typeMeta.height || 200
  };

  function renderAccessory(category) {
    const list = pet.equippedAccessories?.[category] || [];
    if (!list || list.length === 0) return null;
    
    const node = typeMeta.nodes?.[category];
    if (!node) return null;
    
    return list.map((sprite, i) => (
      <img
        key={`${category}-${i}`}
        src={`/pets/${sprite}`}
        alt={sprite}
        className="virtual-pet-accessory"
        style={{
          position: "absolute",
          left: node.x,
          top: node.y,
          height: "75px",
          pointerEvents: "none",
        }}
        draggable={false}
      />
    ));
  }


  return (
    <>
      <nav style={{
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "55px",
  background: "#2e2952",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  boxSizing: "border-box",
  zIndex: 1001,
  boxShadow: "0 2px 10px rgb(241, 219, 170)"
}}>
  <div style={{ display: "flex", gap: "20px" }}>
    <a href="/" style={navLinkStyle}>Home</a>
    <a href="/dashboard" style={navLinkStyle}>Dashboard</a>
    <a href="/shop" style={navLinkStyle}>Pet Shop</a>
    <a href="/focus" target="_blank" rel="noopener noreferrer" style={navLinkStyle}>Focus Mode</a>
    <a href="/activity" target="_blank" rel="noopener noreferrer" style={navLinkStyle}>Activity Tracker</a>
    <a href="/mood" style={navLinkStyle}>Mood Journal</a>
    <a href="/mira" style={navLinkStyle}>Mira</a>
    <a href="/help" style={navLinkStyle}>Distraction Blocker</a>
  </div>

  {/* Right side buttons + Profile */}
  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <button
      onClick={() => {
        setPetVisible(!petVisible);
        if (petVisible) setIsDraggable(false);
      }}
      style={{
        background: petVisible ? "#2e2952" : "#827397",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        padding: "6px 14px",
        transition: "background 0.3s ease"
      }}
    >
      {petVisible ? "Send Pet Away" : "Bring Pet Back"}
    </button>

    <button
      className="pet-drag-toggle"
      onClick={() => setIsDraggable(!isDraggable)}
      style={{
        background: isDraggable ? "#2e2952" : "#827397",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "background 0.3s ease"
      }}
    >
      {isDraggable ? <><LockOpen size={15}/> Drag Pet</> : <><Lock size={15}/> Pet Locked</>}
    </button>

    <a
      href="/profile"
      title="Profile"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#f1dbaa",
        textDecoration: "none",
        fontSize: "0.9rem",
        fontWeight: "500",
        padding: "4px 10px",
        borderRadius: "20px",
        border: "1px solid #827397",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#827397";
        e.currentTarget.style.borderColor = "#f1dbaa";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "#827397";
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f1dbaa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      Profile
    </a>
  </div>
</nav>
      {petVisible && (
    <div 
      className="virtual-pet-wrapper" 
      onMouseDown={handleMouseDown}
    >
      <div 
        className="virtual-pet-wrapper" 
        style={{ 
          width: containerSize.width, 
          height: containerSize.height,
          position: "fixed",
          left: position.x,
          top: position.y,
          pointerEvents: isDraggable ? "auto" : "none",
          cursor: isDraggable ? (isDragging ? "grabbing" : "grab") : "default",
          zIndex: 1000,
          transition: isDragging ? "none" : "all 0.1s ease"
        }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="virtual-pet-container" 
          style={{ 
            width: containerSize.width, 
            height: containerSize.height 
          }}
        >
          {/* BASE PET SPRITE */}
          <img
            src={`/pets/${pet.baseSprite}`}
            alt={pet.petType}
            className="virtual-pet-base"
            style={{ 
              width: containerSize.width, 
              height: containerSize.height, 
              pointerEvents: isDraggable ? "none" : "auto",
              userSelect: "none"
            }}
            onClick={() => {
              if (!isDraggable) {
                setSparkle(true);
                setTimeout(() => setSparkle(false), 800);
              }
            }}
            draggable={false}
          />
          
          {/* SPARKLE OVERLAY */}
          {sparkle && (
            <img
              src="/pets/sparkle.png"
              className="sparkle-animation"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: containerSize.width,
                height: containerSize.height,
                pointerEvents: "none"
              }}
              draggable={false}
            />
          )}
          
          {/* ACCESSORIES */}
          {renderAccessory("head")}
          {renderAccessory("neck")}
          {renderAccessory("tail")}
        </div>
      </div>
    </div>)}
    </>
  );
}