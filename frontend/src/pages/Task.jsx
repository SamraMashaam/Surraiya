import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Styles/IdeaParkingLot.css";
import { useNavigate } from "react-router-dom";

export default function Task() {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const navigate = useNavigate();

  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function loadIdeas() {
      try {
        const res = await axios.get(`http://localhost:5000/api/tasks/${user.id}`);
        setIdeas(res.data.tasks);
      } catch (err) {
        console.error(err);
      }
    }

    loadIdeas();
  }, [user]);


  async function addIdea() {
    if (newIdea.trim() === "") return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        userId: user.id,
        text: newIdea
      });

      setIdeas(prev => [res.data.task, ...prev]);
      setNewIdea("");

    } catch (err) {
      console.error(err);
    }
  }

  async function deleteIdea(id) {
    try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        setIdeas(prev => prev.filter(i => i._id !== id));
        const amount = 5;
        console.log("amount: ", amount)
        const res = await axios.put(`http://localhost:5000/api/users/${user.id}/currency`, {amount});
        console.log("task Currency update: ", res.data.user);
      
        let stored = JSON.parse(localStorage.getItem("user"));
    
        stored.currency = res.data.user.currency;
      
        localStorage.setItem("user", JSON.stringify(stored));
        console.log("Local task Currency:", stored.currency);
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
        `http://localhost:5000/api/tasks/${editingId}`,
        { text: editingText }
      );

      setIdeas(prev =>
        prev.map(i => (i._id === editingId ? res.data.task : i))
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

      <h1 className="idea-title">Tackle Big Problems, One Small Step At A Time</h1>
      <h3 className="idea-title">Complete tasks to earn coins!</h3>

      {/* Input Bar */}
      <div className="idea-input-box">
        <textarea
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="I should..."
        />
        <button className="add-btn" onClick={addIdea}>Add Task</button>
      </div>

      {/* Ideas List */}
      <div style={{
      background: '#2e2952',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid #f1dbaa',
      color: '#e9d5da'
    }} className="idea-list">
        {ideas.length === 0 ? (
          <p className="empty-msg">No tasks set yet</p>
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
                      Task Complete
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