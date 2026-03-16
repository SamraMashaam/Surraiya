import React, { useEffect, useState } from "react";
import "./Styles/VirtualPet.css";
import axios from "axios";
import { Lock, LockOpen } from 'lucide-react';

export default function VirtualPet({ pet, user }) {
  console.log("VirtualPet received pet:", pet);
  const [petTypes, setPetTypes] = useState(null);
  const [sparkle, setSparkle] = useState(false);
  
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
  
  if (!pet) return (
    <div className="no-pet-message">
      You don't have a pet yet. Go to the shop to choose one!
    </div>
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
      {/* Toggle drag mode button */}
      <button 
        className="pet-drag-toggle"
        onClick={() => setIsDraggable(!isDraggable)}
        style={{
          position: "fixed",
          top: 20,             
          left: "50%",        
          transform: "translateX(-50%)",
          zIndex: 1001,
          padding: "10px 16px",
          background: isDraggable ? "#2e2952" : "#827397",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          transition: "background 0.3s ease"
        }}
      >
        {isDraggable ?  <><LockOpen size={15}/>  Drag Pet</> : <><Lock size={15}/>  Pet Locked</>}
      </button>

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
    </>
  );
}