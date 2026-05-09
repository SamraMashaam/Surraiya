import React, { useEffect, useState } from "react";
import "./Styles/VirtualPet.css";

export default function VirtualPet({ pet, user, petVisible, setPetVisible, isDraggable, setIsDraggable }) {
  const [petTypes, setPetTypes] = useState(null);
  const [sparkle, setSparkle] = useState(false);
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

  useEffect(() => {
    localStorage.setItem("petPosition", JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!petTypes) return null;
  if (!user || !pet) return null;

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
              
              {sparkle && (
                <img
                  src="/pets/sparkle.png"
                  alt=""
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
              
              {renderAccessory("head")}
              {renderAccessory("neck")}
              {renderAccessory("tail")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
