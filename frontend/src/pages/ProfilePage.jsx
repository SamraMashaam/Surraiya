import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from 'lucide-react';
import "./Styles/ProfilePage.css";

const ProfilePage = ({ user, setUser, refreshUser }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'username', 'password', or 'picture'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Username edit state
  const [newUsername, setNewUsername] = useState("");
  
  // Password edit state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile picture state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if user exists and redirect if not
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    
    // If user prop is null but we have stored user, try to update parent
    if (!user && storedUser) {
      setUser && setUser(storedUser);
    }
    
    setIsLoadingUser(false);
  }, [navigate, user, setUser]);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Clear message after 3 seconds
  const showMessage = (text, type = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage("Please select an image file");
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image size should be less than 5MB");
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      showMessage("Please select an image first");
      return;
    }
    
    setUploadingImage(true);
    
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('profilePicture', selectedImage);
      
      const url = `http://localhost:5000/api/users/${user._id}/profile-picture`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showMessage(data.message || "Failed to upload profile picture");
        setUploadingImage(false);
        return;
      }
      
      // Update user in localStorage and state
      let stored = JSON.parse(localStorage.getItem("user"));
      stored.profilePic = data.profilePic; 
      localStorage.setItem("user", JSON.stringify(stored));
      setUser && setUser(stored);
      
      // Show success message
      showMessage("Profile picture updated successfully!", "success");
      
      // Reset image selection
      setSelectedImage(null);
      setImagePreview(null);
      setEditMode(null);
      setIsEditing(false);
      
      setUploadingImage(false);
      
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showMessage("Server error. Please try again.");
      setUploadingImage(false);
    }
  };

  // Cancel image upload
  const handleCancelImageUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setEditMode(null);
    setIsEditing(false);
  };

  // Handle username update
  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      showMessage("Username cannot be empty");
      return;
    }
    
    if (newUsername.length < 3 || newUsername.length > 20) {
      showMessage("Username must be between 3 and 20 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = getToken();
      const url = `http://localhost:5000/api/users/${user._id}/username`;
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername })
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        showMessage(`Server error: ${responseText.substring(0, 100)}`);
        return;
      }
      
      if (!response.ok) {
        showMessage(data.message || "Failed to update username");
        return;
      }
      
      // Show success message
      showMessage("Username updated successfully! Please log in again.", "success");
      
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      refreshUser();
      
      navigate("/login");
      
    } catch (error) {
      console.error("Error updating username:", error);
      showMessage("Server error. Please try again.");
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("All password fields are required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage("New password and confirm password do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = getToken();
      const url = `http://localhost:5000/api/users/${user._id}/password`;
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        showMessage(`Server error: ${responseText.substring(0, 100)}`);
        return;
      }
      
      if (!response.ok) {
        showMessage(data.message || "Failed to update password");
        setLoading(false);
        return;
      }
      
      // Show success message
      showMessage("Password updated successfully! Please log in with your new password.", "success");
      
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      refreshUser();
      
      navigate("/login");
      
    } catch (error) {
      console.error("Error updating password:", error);
      showMessage("Server error. Please try again.");
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditMode(null);
    setIsEditing(false);
    setNewUsername("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSelectedImage(null);
    setImagePreview(null);
    setMessage({ text: "", type: "" });
  };

  // Show loading state while checking user
  if (isLoadingUser) {
    return (
      <div className="profile-page loading">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // If still no user after loading, show error
  if (!user) {
    return (
      <div className="profile-page loading">
        <h2>Unable to load profile. Please login again.</h2>
        <button className="action-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <h2>Your Profile</h2>
      </div>

      <div className="profile-card card">
        <div className="profile-avatar-container">
          <img src={user.profilePic || "/home.jpg"} alt="profile" className="profile-avatar-large" />
          {!isEditing && (
            <button 
              className="change-picture-btn" 
              onClick={() => {
                setIsEditing(true);
                setEditMode("picture");
              }}
              title="Change profile picture"
            >
              <Camera size={20} color="#0a192f" strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Username:</span>
            <span className="value">{user.userName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Currency:</span>
            <span className="value">{user.currency || 0}</span>
          </div>
          <div className="detail-row">
            <span className="label">Friends Count:</span>
            <span className="value">{user.friends ? user.friends.length : 0}</span>
          </div>
          
          {/* Message display */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {/* Edit Buttons */}
          {!isEditing ? (
            <div className="profile-actions">
              <button className="action-btn edit-btn1" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="action-btn" onClick={() => navigate("/friends")}>
                Manage Friends
              </button>
            </div>
          ) : (
            <div className="edit-options">
              {!editMode ? (
                <div className="edit-mode-selector">
                  <h3>What would you like to edit?</h3>
                  <div className="edit-buttons">
                    <button 
                      className="action-btn edit-type-btn" 
                      onClick={() => setEditMode("picture")}
                    >
                      Change Profile Picture
                    </button>
                    <button 
                      className="action-btn edit-type-btn" 
                      onClick={() => setEditMode("username")}
                    >
                      Change Username
                    </button>
                    <button 
                      className="action-btn edit-type-btn" 
                      onClick={() => setEditMode("password")}
                    >
                      Change Password
                    </button>
                    <button 
                      className="action-btn cancel-btn" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              
              {/* Profile Picture Upload Form */}
              {editMode === "picture" && (
                <form className="edit-form" onSubmit={handleProfilePictureUpload}>
                  <h3>Update Profile Picture</h3>
                  
                  <div className="image-upload-container">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" className="preview-image" />
                        <p className="preview-text">Preview of new profile picture</p>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Camera size={60} color="#987eb4"/>
                        <p>Select an image to upload</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      id="profile-picture-input"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                    
                    <label htmlFor="profile-picture-input" className="file-input-label">
                      {selectedImage ? 'Choose Different Image' : 'Choose Image'}
                    </label>
                    
                    {selectedImage && (
                      <p className="file-info">{selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)</p>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="action-btn submit-btn1" 
                      disabled={uploadingImage || !selectedImage}
                    >
                      {uploadingImage ? "Uploading..." : "Upload Picture"}
                    </button>
                    <button 
                      type="button" 
                      className="action-btn cancel-btn1" 
                      onClick={handleCancelImageUpload}
                      disabled={uploadingImage}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {/* Username Edit Form */}
              {editMode === "username" && (
                <form className="edit-form" onSubmit={handleUsernameUpdate}>
                  <h3>Update Username</h3>
                  <div className="form-group1">
                    <label>New Username</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="action-btn submit-btn1" disabled={loading}>
                      {loading ? "Updating..." : "Update Username"}
                    </button>
                    <button type="button" className="action-btn cancel-btn1" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {/* Password Edit Form */}
              {editMode === "password" && (
                <form className="edit-form" onSubmit={handlePasswordUpdate}>
                  <h3>Update Password</h3>
                  <div className="form-group1">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <div className="form-group1">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group1">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="action-btn submit-btn" disabled={loading}>
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                    <button type="button" className="action-btn cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
