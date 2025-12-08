import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles/ShopPage.css";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(null); // user's active pet
  const [pets, setPets] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const navigate = useNavigate();

  /* ------------------- LOAD USER ------------------- */
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

        setUser({
          _id: data._id,
          currency: data.currency || 0,
          petId: data.petId || null,
          ownedAccessories: data.ownedAccessories || []
        });

        // fetch equipped pet if any
        console.log("curent data: ", data.petID._id)
        if (data.petID) {
          const petRes = await axios.get(`http://localhost:5000/api/pets/${data.petID._id}`);
          console.log("curent pet: ", petRes.data)
          setPet(petRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [navigate]);

  /* ------------------- STATIC SPRITES ------------------- */
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
  console.log("ID ",storedUser.petID);
  const userHasPet = storedUser.petID != null;

  /* ------------------- HELPERS ------------------- */
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

      // update React state
      setUser(prev => {
        const updatedUser = { 
          ...prev, 
          currency: data.currency, 
          petId: data.pet._id 
        };

        // update localStorage
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user")), // keep other fields like name, email
          petID: updatedUser.petId,
          currency: updatedUser.currency
        }));

        return updatedUser;
      });

      // update pet state
      setPet(data.pet);
    } catch (err) {
      console.error(err);
    }
  };


  const buyAccessory = async (acc) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/shop/buy/accessory`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setUser(prev => ({
        ...prev,
        currency: data.user.currency,
        ownedAccessories: [...(prev.ownedAccessories || []), acc]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const equipAccessory = async (acc) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/shop/equip/accessory/${user.petId}`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setPet(prev => ({ ...prev, equippedAccessories: data.pet.equippedAccessories }));
    } catch (err) {
      console.error(err);
    }
  };

  const unequipAccessory = async (acc) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/shop/unequip/accessory/${user.petId}`, {
        userId: user._id,
        accessory: acc
      });
      const data = res.data;
      if (data.error) return alert(data.error);

      setPet(prev => ({ ...prev, equippedAccessories: data.pet.equippedAccessories }));
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------- RENDER ------------------- */
  const renderPetItem = (petSprite) => {
    const isActivePet = userHasPet && pet?.baseSprite === petSprite;
    const price = userHasPet ? 250 : 0;

    return (
      <div className="shop-item" key={petSprite}>
        <img src={`/pets/${petSprite}`} alt={petSprite} />
        <p className="shop-item-name">{petSprite.replace(".png", "")}</p>

        {isActivePet ? (
          <button className="equipped-btn">Equipped</button>
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
    const owns = (user.ownedAccessories || []).includes(acc);
    const equipped = pet?.equippedAccessories?.[node] === acc;

    return (
      <div className="shop-item" key={acc}>
        <img src={`/pets/${acc}`} alt={acc} />
        <p className="shop-item-name">{acc.replace(".png", "")}</p>

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
