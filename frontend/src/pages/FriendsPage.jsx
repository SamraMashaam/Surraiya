import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles/FriendsPage.css";

const FriendsPage = ({ user }) => {
  
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
      document.title = "Manage Friends";
    }, []);
  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchBlockedUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/friends`);
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/blocked`);
      setBlockedUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch blocked users", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSearchResult(null);
    setSuccessMsg("");
    if (!searchUsername.trim()) return;

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/search/${searchUsername}`);
      if (res.data._id === user._id) {
        setErrorMsg("You cannot add yourself.");
        return;
      }
      setSearchResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setErrorMsg("User not found.");
      } else {
        setErrorMsg("An error occurred during search.");
      }
      setSearchResult(null);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/friends/${searchResult._id}`);
      setSuccessMsg("Friend added successfully!");
      setSearchResult(null);
      setSearchUsername("");
      fetchFriends();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to add friend.");
    }
  };

  const handleBlockFriend = async (friendId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/block/${friendId}`);
      setSuccessMsg("User blocked.");
      fetchFriends();
      fetchBlockedUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to block user.");
    }
  };

  const handleUnblockUser = async (blockedUserId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${user._id}/unblock/${blockedUserId}`);
      setSuccessMsg("User unblocked.");
      fetchBlockedUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to unblock user.");
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>&larr; Back to Dashboard</button>
        <h2>Your Friends</h2>
      </div>

      <div className="friends-content">

        {/* Search section — unchanged */}
        <div className="search-section card">
          <h3>Find a Friend</h3>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Enter Exact Username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          {errorMsg && <p className="error-msg">{errorMsg}</p>}
          {successMsg && <p className="success-msg">{successMsg}</p>}

          {searchResult && (
            <div className="search-result">
              <div className="user-info">
                <img src={searchResult.profilePic || "/home.jpg"} alt="profile" className="avatar" />
                <span>{searchResult.userName}</span>
              </div>
              <button className="add-btn" onClick={handleAddFriend}>Add Friend</button>
            </div>
          )}
        </div>

        {/* Friends list — unchanged except block also refreshes blocked list */}
        <div className="friends-list card">
          <h3>Your Friends List</h3>
          {friends.length === 0 ? (
            <p className="no-friends">You don't have any friends yet.</p>
          ) : (
            <ul>
              {friends.map((friend) => (
                <li key={friend._id} className="friend-item">
                  <div className="user-info">
                    <img src={friend.profilePic || "/home.jpg"} alt="profile" className="avatar" />
                    <span>{friend.userName}</span>
                  </div>
                  <button className="block-btn" onClick={() => handleBlockFriend(friend._id)}>Block</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Blocked users list — new */}
        <div className="friends-list card">
          <h3>Blocked Users</h3>
          {blockedUsers.length === 0 ? (
            <p className="no-friends">You haven't blocked anyone.</p>
          ) : (
            <ul>
              {blockedUsers.map((blocked) => (
                <li key={blocked._id} className="friend-item">
                  <div className="user-info">
                    <img src={blocked.profilePic || "/home.jpg"} alt="profile" className="avatar" />
                    <span>{blocked.userName}</span>
                  </div>
                  <button className="unblock-btn" onClick={() => handleUnblockUser(blocked._id)}>
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default FriendsPage;