import React, { useEffect, useState } from "react";
import "./Styles/VirtualPet.css";
import axios from "axios";

export default function VirtualPet() {
  const [petTypes, setPetTypes] = useState(null);
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(null);
  const [sparkle, setSparkle] = useState(false);

  useEffect(() => {
    fetch("/pets/petTypes.json")
      .then(res => res.json())
      .then(data => setPetTypes(data))
      .catch(err => console.error(err));
  }, []);


  useEffect(() => {
    async function loadUserPet() {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser == null) return;
        const userRes = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
        const currentUser = userRes.data;
        setUser(currentUser);

        if (!currentUser.petID) {
          console.log("User has no pet yet");
          return;
        }

        const petRes = await axios.get(`http://localhost:5000/api/pets/${currentUser.petID._id}`);
        const petData = petRes.data;

        // Add equippedAccessories as top-level arrays for easier rendering
        setPet({
          ...petData,
          head: petData.equippedAccessories?.head || [],
          neck: petData.equippedAccessories?.neck || [],
          tail: petData.equippedAccessories?.tail || [],
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadUserPet();
  }, []);

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
    const list = pet[category];
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
    <div className="virtual-pet-wrapper" style={{ width: containerSize.width, height: containerSize.height }}>
      <div className="virtual-pet-container" style={{ width: containerSize.width, height: containerSize.height }}>
        {/* BASE PET SPRITE */}
        <img
          src={`/pets/${pet.baseSprite}`}
          alt={pet.petType}
          className="virtual-pet-base"
          style={{ width: containerSize.width, height: containerSize.height, pointerEvents: "auto" }}
          onClick={() => {
            setSparkle(true);
            setTimeout(() => setSparkle(false), 800);
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
  );
}
