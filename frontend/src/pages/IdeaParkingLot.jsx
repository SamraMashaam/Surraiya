import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Styles/IdeaParkingLot.css";
import { useNavigate } from "react-router-dom";

export default function IdeaParkingLot() {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const navigate = useNavigate();

  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? (user.id || user._id) : null;

  useEffect(() => {
    document.title = "Idea Parking Lot";
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadIdeas() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ideas/${userId}`);
        setIdeas(res.data.ideas);
      } catch (err) {
        console.error(err);
      }
    }

    loadIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  async function addIdea() {
    if (newIdea.trim() === "") return;

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/ideas`, {
        userId: userId,
        text: newIdea
      });

      setIdeas(prev => [res.data.idea, ...prev]);
      setNewIdea("");

    } catch (err) {
      console.error(err);
    }
  }

  async function deleteIdea(id) {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/ideas/${id}`);
      setIdeas(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      console.error(err);
    }
  }


  function startEditing(idea) {
    setEditingId(idea._id);
    setEditingText(idea.text);
  }


  async function saveEdit() {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/ideas/${editingId}`,
        { text: editingText }
      );

      setIdeas(prev =>
        prev.map(i => (i._id === editingId ? res.data.idea : i))
      );

      setEditingId(null);
      setEditingText("");

    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="idea-body">
    <div className="idea-container">

      <h1 className="idea-title">Idea Parking Lot</h1>
      <h2 >Getting side-tracked? Write down your ideas here, and revisit them when you're free.</h2>
      {/* Input Bar */}
      <div className="idea-input-box">
        <textarea
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Write an idea..."
        />
        <button className="add-btn" onClick={addIdea}>Add Idea</button>
      </div>

      {/* Ideas List */}
      <div className="idea-list">
        {ideas.length === 0 ? (
          <p className="empty-msg">No ideas yet. Start writing!</p>
        ) : (
          ideas.map(idea => (
            <div className="idea-item" key={idea._id}>

              {editingId === idea._id ? (
                <>
                  <textarea
                    className="edit-box"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <button className="save-btn" onClick={saveEdit}>Save</button>
                  <button className="cancel-btn" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p className="idea-text">{idea.text}</p>

                  <div className="idea-actions">
                    <button className="edit-btn" onClick={() => startEditing(idea)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteIdea(idea._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}

            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}
