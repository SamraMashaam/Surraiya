import React, { useState, useEffect } from 'react';
import { Smile, Frown, Angry, Zap, AlertCircle, Minus, MessageCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import './Styles/MoodPage.css';

const ANALYSIS_API_URL = `${process.env.REACT_APP_ANALYSIS_API_URL}/api`;
const NODE_API_URL = `${process.env.REACT_APP_API_URL}/api`;

export default function MoodPage() {
  const [view, setView] = useState('home');
  const [entries, setEntries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const USER_ID = storedUser ? (storedUser.id || storedUser._id) : null;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    if (!storedUser) {
      navigate('/login');
      return;
    }
    if (view === 'entries') fetchEntries();
    else if (view === 'stats') fetchMonthlyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, navigate]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ANALYSIS_API_URL}/entries/${USER_ID}`);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
    setLoading(false);
  };

  const fetchMonthlyStats = async () => {
  setLoading(true);
  try {
    const response = await fetch(
      `${ANALYSIS_API_URL}/entries/${USER_ID}/monthly?year=${currentYear}&month=${currentMonth}`
    );
    if (!response.ok) {
      setMonthlyStats(null);
    } else {
      const data = await response.json();
      setMonthlyStats(data);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    setMonthlyStats(null);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="mood-page">
      <nav className="mood-nav">
        <div className="mood-nav-inner">
          <h1 className="mood-nav-title">Mood Journal</h1>
          <div className="mood-nav-buttons">
            <button
              className={`mood-nav-btn ${view === 'home' ? 'active' : ''}`}
              onClick={() => setView('home')}
            >
              New Entry
            </button>
            <button
              className={`mood-nav-btn ${view === 'entries' ? 'active' : ''}`}
              onClick={() => setView('entries')}
            >
              All Entries
            </button>
            <button
              className={`mood-nav-btn ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              Monthly Stats
            </button>
          </div>
        </div>
      </nav>

      <main className="mood-main">
        {view === 'home' && (
          <NewEntryForm 
            userId={USER_ID} 
            onEntryCreated={() => setView('entries')}
            navigate={navigate}
          />
        )}
        {view === 'entries' && <EntriesList entries={entries} loading={loading} />}
        {view === 'stats' && <MonthlyStats stats={monthlyStats} loading={loading} />}
      </main>
    </div>
  );
}

function NewEntryForm({ userId, onEntryCreated, navigate }) {
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const emojiMoods = [
    { emotion: 'joy', icon: Smile, label: 'Happy' },
    { emotion: 'sadness', icon: Frown, label: 'Sad' },
    { emotion: 'anger', icon: Angry, label: 'Angry' },
    { emotion: 'fear', icon: AlertCircle, label: 'Anxious' },
    { emotion: 'surprise', icon: Zap, label: 'Shocked' },
    { emotion: 'neutral', icon: Minus, label: 'Neutral' }
  ];

  // Emotion messages based on detected mood
  const getEmotionMessage = (emotion) => {
    const messages = {
      'joy': {
        message: "That's wonderful to hear! It's great that you're feeling well today.",
        showChatbot: false
      },
      'neutral': {
        message: "Thank you for sharing. Sometimes a neutral day is perfectly okay.",
        showChatbot: false
      },
      'sadness': {
        message: "I'm sorry you're feeling this way. Remember, it's okay to not be okay.",
        showChatbot: true
      },
      'anger': {
        message: "I can sense your frustration. It's valid to feel angry sometimes.",
        showChatbot: true
      },
      'fear': {
        message: "Anxiety can be really challenging. You're not alone in feeling this way.",
        showChatbot: true
      },
      'disgust': {
        message: "It sounds like something's really bothering you. That's completely valid.",
        showChatbot: true
      },
      'surprise': {
        message: "Sounds like something unexpected happened!",
        showChatbot: false
      }
    };

    return messages[emotion.toLowerCase()] || messages['neutral'];
  };

  const handleChatWithMira = async () => {
    if (!result || !result.id) return;

    setLoadingInsight(true);
    
    try {
      // Call the bonus API endpoint to get chatbot analysis
      const response = await fetch(`${ANALYSIS_API_URL}/chat/analyze-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: result.id })
      });

      if (!response.ok) throw new Error('Failed to get chatbot insights');

      const data = await response.json();
      
      // Store the entry context in localStorage for the chatbot page
      localStorage.setItem('chatbot_context', JSON.stringify({
        entry_id: result.id,
        emotion: result.emotion,
        content: result.entryContent,  
        analysis: data.analysis
      }));

      console.log('Stored context:', localStorage.getItem('chatbot_context')); // Debug

      // Navigate to chatbot page
      navigate('/mira');
      
    } catch (err) {
      console.error('Error getting chatbot insights:', err);
      // Even if API fails, navigate to chatbot with basic context
      localStorage.setItem('chatbot_context', JSON.stringify({
        emotion: result.emotion,
        content: result.entryContent 
      }));
      navigate('/mira');
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleSubmit = async () => {
    let entryContent = (content || '').trim();

    if (!entryContent && selectedEmoji) {
      const emojiPrompts = {
        'joy': 'I am feeling happy and joyful today',
        'sadness': 'I am feeling sad and down today',
        'anger': 'I am feeling angry and frustrated today',
        'fear': 'I am feeling anxious and worried today',
        'surprise': 'I am feeling surprised today',
        'neutral': 'Hello. This is my journal entry.'
      };
      entryContent = emojiPrompts[selectedEmoji.emotion];
    }

    if (entryContent.length < 5 && !selectedEmoji) {
      setError('Entry must be at least 5 characters long or select an emoji');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${ANALYSIS_API_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, content: entryContent })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', response.status, errorData);
        throw new Error(errorData.detail?.[0]?.msg || errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const analysisData = data;

      try {
        await fetch(`${NODE_API_URL}/users/${userId}/mood`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emotion: analysisData.emotion,
            content: entryContent,
            date: new Date()
          })
        });
        console.log("Mood saved to Node Graph successfully");
      } catch (nodeError) {
        console.error("Failed to save to graph:", nodeError);
      }

      analysisData.entryContent = entryContent;
      
      setResult(analysisData);
      setContent('');
      setSelectedEmoji(null);
    } catch (err) {
      setError(err.message || 'Failed to save entry. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const emotionResponse = result ? getEmotionMessage(result.emotion) : null;

  return (
    <div className="entry-form-card">
      <h2 className="entry-form-title">How are you feeling today?</h2>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your day, your feelings, or anything on your mind..."
          className="entry-textarea"
        />

        {error && <p className="entry-error">{error}</p>}

        <div className="emoji-section">
          <p className="emoji-section-label">
            Don't feel like writing? Use an icon to express your mood.
          </p>
          <div className="emoji-grid">
            {emojiMoods.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.emotion}
                  onClick={() => setSelectedEmoji(mood)}
                  className={`emoji-btn ${selectedEmoji?.emotion === mood.emotion ? 'selected' : ''}`}
                >
                  <Icon size={32} strokeWidth={1.5} color="#6EE7B7" />
                  <span className="emoji-btn-label">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (content.length < 5 && !selectedEmoji)}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Analyzing...' : 'Save Entry'}
        </button>
      </div>

      {result && emotionResponse && (
        <div className="result-card">
          <h3 className="result-card-title">We hear you.</h3>
          
          <div className="emotion-response">
            <p className="result-text">
              <strong>Detected emotion:</strong> {result.emotion}
            </p>
            
            <div className="emotion-message">
              <p>{emotionResponse.message}</p>
            </div>

            {emotionResponse.showChatbot && (
              <div className="chatbot-offer">
                <p className="chatbot-offer-text">
                  Would you like to talk to Mira about how you're feeling? 
                  She can provide personalized support and coping strategies.
                </p>
                
                <button
                  onClick={handleChatWithMira}
                  disabled={loadingInsight}
                  className="chatbot-offer-btn"
                >
                  <MessageCircle size={20} />
                  {loadingInsight ? 'Preparing conversation...' : 'Yes, chat with Mira'}
                </button>
                
                <button
                  onClick={() => setResult(null)}
                  className="chatbot-decline-btn"
                >
                  No, maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EntriesList({ entries, loading }) {
  if (loading) {
    return <div className="loading-text">Loading entries...</div>;
  }

  if (!entries.length) {
    return (
      <div className="entries-empty">
        <p>No entries yet. Start journaling to see your entries here!</p>
      </div>
    );
  }

  return (
    <div className="entries-grid">
      <h2 className="entries-title">Your Entries</h2>
      {entries.map((entry) => (
        <div key={entry.id} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-card-date">
              {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="entry-card-emotion">{entry.emotion}</span>
          </div>
          <p className="entry-card-content">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}

function MonthlyStats({ stats, loading }) {
  if (loading) {
    return <div className="loading-text">Loading statistics...</div>;
  }

  if (!stats) {
    return (
      <div className="stats-empty">
        <p>No entries for this month yet.</p>
      </div>
    );
  }

  const getMonthName = (yearMonth) => {
    if (!yearMonth) return '';
    const monthNumber = parseInt(yearMonth.split('-')[1], 10);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNumber - 1] ?? '';
  };

  return (
    <div className="stats-grid">
      <h2 className="stats-title">
        Let's look back at your {getMonthName(stats.month)} so far:
      </h2>

      <div className="stats-card">
        <p className="stats-card-label">Your dominant emotion has been:</p>
        <p className="stats-card-value">{stats.dominant_emotion}</p>
      </div>

      <div className="stats-small-grid">
        <div className="stats-small-card">
          <p className="stats-small-label">Total Entries</p>
          <p className="stats-small-value">{stats.total_entries}</p>
        </div>
        <div className="stats-small-card">
          <p className="stats-small-label">Our average confidence:</p>
          <p className="stats-small-value">{(stats.average_confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="breakdown-card">
        <h3 className="breakdown-title">Emotion Breakdown</h3>
        <div className="breakdown-rows">
          {Object.entries(stats.emotion_breakdown || {})
            .sort((a, b) => b[1].count - a[1].count)
            .map(([emotion, data]) => (
              <div key={emotion}>
                <div className="breakdown-row-header">
                  <span className="breakdown-emotion">{emotion}</span>
                  <span className="breakdown-count">{data.count} entries ({data.percentage}%)</span>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}