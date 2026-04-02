import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles/ShopPage.css";

export default function ShopPage({ setPet: setGlobalPet, setUser: setGlobalUser, pet, user }) {
  const [pets, setPets] = useState([]);
  const [accessories, setAccessories] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
        document.title = "Shop";
      }, []);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
        const data = res.data;
        console.log("data: ", data);
        
         if(data.petID){
          setGlobalUser({
            _id: data._id,
            currency: data.currency || 0,
            petId: data.petID._id,
            ownedPets: data.ownedPets || []
          });
        } else {
          setGlobalUser({
            _id: data._id,
            currency: data.currency || 0,
            petId: null,
            ownedPets: data.ownedPets || []
          });
        }

        // Update GLOBAL pet state
        if (data.petID) {
          const petRes = await axios.get(`http://localhost:5000/api/pets/${data.petID._id}`);
          console.log("Current pet: ", petRes.data);
          setGlobalPet(petRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [navigate]);


  useEffect(() => {
    setPets([
      "cat_white.png",
      "cat_black.png",
      "cat_tux.png",
      "dog_black.png",
      "dog_brown.png",
      "dog_gold.png",
      "snake_blue.png",
      "snake_green.png",
      "snake_black.png"
    ]);

    setAccessories([
      "hat_topBlack.png",
      "bow_red.png",
      "bow_pink.png",
      "bow_blue.png",
      "bow_white.png"
    ]);
  }, []);

  if (!user) return null;
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const resolvedPetId = user?.petId ?? pet?._id ?? storedUser?.petID?._id ?? storedUser?.petID;
  console.log("ID ",storedUser.petID);
  const userHasPet = storedUser.petID != null;

  const getAccessoryNode = (filename) => {
    if (filename.startsWith("hat_")) return "head";
    if (filename.startsWith("bow_")) return "neck";
    return "tail";
  };
  
 
  const buyPet = async (petSprite) => {
    try {
      const res = await axios.post("http://localhost:5000/api/shop/buy/pet", {
        userId: user._id,
        petType: petSprite.split("_")[0],
        baseSprite: petSprite
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setGlobalUser(prev => {
        const updatedUser = { 
          ...prev, 
          currency: data.currency, 
          petId: data.pet._id 
        };

        // update localStorage
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user")), 
          petID: updatedUser.petId,
          currency: updatedUser.currency
        }));

        return updatedUser;
      });

      setGlobalPet(data.pet); 
    } catch (err) {
      console.error(err);
    }
  };

  const updatePet = async (petSprite) => {
    try {
      const res = await axios.post("http://localhost:5000/api/shop/equip/pet", {
        userId: user._id,
        petType: petSprite.split("_")[0],
        baseSprite: petSprite
      });
      const data = res.data;
      if (data.error) return alert(data.error);

        setGlobalUser(prev => {
          const updatedUser = { 
            ...prev, 
            petId: data.pet._id 
          };

          localStorage.setItem("user", JSON.stringify({
            ...JSON.parse(localStorage.getItem("user")), 
            petID: updatedUser.petId,
            currency: updatedUser.currency
          }));

        return updatedUser;
      });

      // update pet state
      setGlobalPet(data.pet);
    } catch (err) {
      console.error(err);
    }
  };


  const buyAccessory = async (acc) => {
    try {
      const petId = resolvedPetId;
      const res = await axios.post(`http://localhost:5000/api/shop/buy/accessory`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      // Update currency immediately from buy response
      setGlobalUser(prev => {
        const updatedUser = {
          ...prev,
          currency: data.currency,
          petId: petId
        };
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user")),
          petID: petId,
          currency: data.currency
        }));
        return updatedUser;
      });

      // Now equip using the resolved petId
      const res2 = await axios.post(`http://localhost:5000/api/shop/equip/accessory/${petId}`, {
        userId: user._id,
        accessory: acc
      });
      const data2 = res2.data;
      if (data2.error) return alert(data2.error);

      setGlobalPet(data2.pet);
    } catch (err) {
      console.error(err);
    }
  };

  const equipAccessory = async (acc) => {
    try {
      const petId = resolvedPetId;
      const res = await axios.post(`http://localhost:5000/api/shop/equip/accessory/${petId}`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setGlobalPet(data.pet);
    } catch (err) {
      console.error(err);
    }
  };

  const unequipAccessory = async (acc) => {
    try {
      const petId = resolvedPetId;
      const res = await axios.post(`http://localhost:5000/api/shop/unequip/accessory/${petId}`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setGlobalPet(data.pet);
    } catch (err) {
      console.error(err);
    }
  };

  const renderPetItem = (petSprite) => {
    const isActivePet = userHasPet && pet?.baseSprite === petSprite;
    const price = userHasPet ? 250 : 0;
    const owned = user?.ownedPets?.includes(petSprite);

    return (
      <div className="shop-item" key={petSprite}>
        <img src={`/pets/${petSprite}`} alt={petSprite} />

        {isActivePet ? (
          <button className="equipped-btn">Equipped</button>
        ) : owned? (
          <button className="equipped-btn" onClick={() => updatePet(petSprite)}>Equip</button>
          
        ) : (
          <button className="buy-btn" onClick={() => buyPet(petSprite)}>
            Buy ({price})
          </button>
        )}
      </div>
    );
  };

  const renderAccessoryItem = (acc) => {
    const node = getAccessoryNode(acc);
    const owns = pet?.ownedAccessories?.[node]?.includes(acc);

    const equipped = pet?.equippedAccessories?.[node]?.includes(acc);
    return (
      <div className="shop-item" key={acc}>
        <img src={`/pets/${acc}`} alt={acc} />

        {!userHasPet ? (
          <p className="need-pet-msg">Choose a pet first</p>
        ) : owns ? (
          equipped ? (
            <button className="equipped-btn" onClick={() => unequipAccessory(acc)}>
              Unequip
            </button>
          ) : (
            <button className="equip-btn" onClick={() => equipAccessory(acc)}>
              Equip
            </button>
          )
        ) : (
          <button className="buy-btn" onClick={() => buyAccessory(acc)}>
            Buy (100)
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="shop-container">
      <div className="currency-bar">
        <img src="/pets/coin.png" alt="coin" />
        <span>{user.currency || 0}</span>
      </div>

      <h2 className="section-title">Pets</h2>
      <div className="shop-grid">{pets.map(renderPetItem)}</div>

      <h2 className="section-title">Accessories</h2>
      <div className="shop-grid">{accessories.map(renderAccessoryItem)}</div>
    </div>
  );
}
