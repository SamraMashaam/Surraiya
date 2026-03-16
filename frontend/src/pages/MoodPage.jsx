import React, { useState, useEffect, useRef } from 'react';
import { Smile, Frown, Angry, Zap, AlertCircle, Minus } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const ANALYSIS_API_URL = 'http://localhost:8000/api';
// Node Backend (Database/Graph)
const NODE_API_URL = 'http://localhost:5000/api';

export default function MoodPage() {
  const [view, setView] = useState('home');
  const [entries, setEntries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const USER_ID = storedUser ? storedUser.id : null

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    if (view === 'entries') {
      fetchEntries();
    } else if (view === 'stats') {
      fetchMonthlyStats();
    }
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
      const data = await response.json();
      setMonthlyStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMonthlyStats(null);
    }
    setLoading(false);
  };

  return (
  <div
    style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #2e2952, #827397)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
      position: 'relative',
    }}
  >
    <nav
      style={{
        background: '#2e2952',
        borderBottom: '1px solid #f1dbaa',
        padding: '1rem 2rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f1dbaa' }}>
          Mood Journal
        </h1>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setView('home')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'home' ? '#827397' : 'transparent',
              color: view === 'home' ? 'white' : '#e9d5da',
              border: '1px solid #f1dbaa',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            New Entry
          </button>

          <button
            onClick={() => setView('entries')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'entries' ? '#827397' : 'transparent',
              color: view === 'entries' ? 'white' : '#e9d5da',
              border: '1px solid #f1dbaa',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            All Entries
          </button>

          <button
            onClick={() => setView('stats')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'stats' ? '#827397' : 'transparent',
              color: view === 'stats' ? 'white' : '#e9d5da',
              border: '1px solid #f1dbaa',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Monthly Stats
          </button>
        </div>
      </div>
    </nav>

    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {view === 'home' && <NewEntryForm userId={USER_ID} onEntryCreated={() => setView('entries')} />}
      {view === 'entries' && <EntriesList entries={entries} loading={loading} />}
      {view === 'stats' && <MonthlyStats stats={monthlyStats} loading={loading} />}
    </main>
  </div>
);

}

function NewEntryForm({ userId, onEntryCreated }) {
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const emojiMoods = [
    { emotion: 'joy', icon: Smile, label: 'Happy' },
    { emotion: 'sadness', icon: Frown, label: 'Sad' },
    { emotion: 'anger', icon: Angry, label: 'Angry' },
    { emotion: 'fear', icon: AlertCircle, label: 'Anxious' },
    { emotion: 'surprise', icon: Zap, label: 'Shocked' },
    { emotion: 'neutral', icon: Minus, label: 'Neutral' }
  ];

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
      body: JSON.stringify({
        user_id: userId,
        content: entryContent
      })
    });

    if (!response.ok) throw new Error('Failed to create entry');

    const data = await response.json();
    const analysisData = data;

    try {
      await fetch(`${NODE_API_URL}/users/${userId}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: analysisData.emotion, // The emotion Python found (e.g., "joy")
          content: entryContent,
          date: new Date()
        })
      });
      console.log("Mood saved to Node Graph successfully");
    } catch (nodeError) {
      console.error("Failed to save to graph:", nodeError);
      
    }
    setResult(analysisData);
    setContent('');
    setSelectedEmoji(null); 
  } catch (err) {
    setError('Failed to save entry. Please try again.');
    console.error(err);
  }
  setLoading(false);
};
  return (
  <div
    style={{
      background: '#4d4c7d',
      borderRadius: '0.75rem',
      padding: '2rem',
      border: '1px solid #f1dbaa',
      color: 'white'
    }}
  >
    <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f1dbaa' }}>
      How are you feeling today?
    </h2>
    
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write about your day, your feelings, or anything on your mind..."
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '1rem',
          border: '1px solid #f1dbaa',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
          background: '#2e2952',
          color: '#e9d5da',
          outline: 'none'
        }}
      />
      
      {error && (
        <p style={{ color: '#e9d5da', fontSize: '0.9rem', margin: '0.5rem 0' }}>
          {error}
        </p>
      )}

        <div
    style={{
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #f1dbaa'
    }}
  >
    <p
      style={{
        fontSize: '0.9rem',
        color: '#e9d5da',
        marginBottom: '1rem'
      }}
    >
      Don't feel like writing? Use an icon to express your mood.
    </p>

    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {emojiMoods.map((mood) => {
        const Icon = mood.icon;
        return (
          <button
            key={mood.emotion}
            onClick={() => setSelectedEmoji(mood)}
            style={{
              padding: '1rem',
              background:
                selectedEmoji?.emotion === mood.emotion ? '#2e2952' : '#2e2952',
              border:
                selectedEmoji?.emotion === mood.emotion
                  ? '2px solid #f1dbaa'
                  : '1px solid #f1dbaa',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '80px',
              transition: 'all 0.2s ease',
              boxShadow:
                selectedEmoji?.emotion === mood.emotion
                  ? '0 0 10px rgba(241, 219, 170, 0.6)'
                  : 'none'
            }}
          >
            <Icon size={32} strokeWidth={1.5} color="#f1dbaa" />
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: '500',
                color: '#e9d5da'
              }}
            >
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>


      <button
        onClick={handleSubmit}
        disabled={loading || (content.length < 5  && !selectedEmoji)}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: loading ? '#4d4c7d' : '#827397',
          color: 'white',
          border: '1px solid #f1dbaa',
          borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        {loading ? 'Analyzing...' : 'Save Entry'}
      </button>
    </div>

    {result && (
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#2e2952',
          borderRadius: '0.75rem',
          border: '1px solid #f1dbaa',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: '600', color: '#f1dbaa' }}>
          We hear you.
        </h3>
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '1rem', margin: '0.5rem 0', color: '#e9d5da' }}>
            <strong>It seems like today you're feeling:</strong> {result.emotion}
          </p>
          <p style={{ fontSize: '1rem', margin: '0.5rem 0', color: '#e9d5da' }}>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
          </p>
          <div style={{ marginTop: '1rem' }}>
            <strong>All Emotions:</strong>
            <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
              {Object.entries(result.all_scores).map(([emotion, score]) => (
                <div
                  key={emotion}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span style={{ width: '80px', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    {emotion}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '20px',
                      background: '#4d4c7d',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${score * 100}%`,
                        background: '#f1dbaa'
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      width: '50px',
                      textAlign: 'right',
                      color: '#e9d5da'
                    }}
                  >
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

}

function EntriesList({ entries, loading }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading entries...</div>;
  }

  if (!entries.length) {
    return (
      <div style={{ background: '#4d4c7d', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#e9d5da' }}>No entries yet. Start journaling to see your entries here!</p>
      </div>
    );
  }

  return (
  <div style={{ display: 'grid', gap: '1rem', color: 'white' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f1dbaa' }}>
      Your Entries
    </h2>

    {entries.map((entry) => (
      <div
        key={entry.id}
        style={{
          background: '#4d4c7d',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #f1dbaa'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#e9d5da' }}>
            {new Date(entry.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>

          <span
            style={{
              padding: '0.25rem 0.75rem',
              background: '#2e2952',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#f1dbaa',
              border: '1px solid #f1dbaa',
              textTransform: 'capitalize'
            }}
          >
            {entry.emotion}
          </span>
        </div>

        <p style={{ lineHeight: '1.6', margin:  '0', color: '#e9d5da' }}>
          {entry.content}
        </p>
      </div>
    ))}
  </div>
);

}

function MonthlyStats({ stats, loading }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading statistics...</div>;
  }

  if (!stats) {
    return (
      <div style={{ background: '#4d4c7d', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#e9d5da' }}>No entries for this month yet.</p>
      </div>
    );
  }

  const getMonthName = (yearMonth) => {
    if (!yearMonth) return '';
      const monthNumber = parseInt(yearMonth.split('-')[1], 10);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June','July', 'August', 'September', 'October', 'November', 'December'];

    return monthNames[monthNumber - 1] ?? '';
  };

  return (
  <div style={{ display: 'grid', gap: '1.5rem', color: 'white' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f1dbaa' }}>
      Let's look back at your {getMonthName(stats.month)} so far:
    </h2>
    
    <div
      style={{
        background: '#4d4c7d',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #f1dbaa'
      }}
    >
      <p style={{ fontSize: '0.9rem', color: '#e9d5da', margin: '0 0 0.5rem 0' }}>
        Your dominant emotion has been:
      </p>
      <p
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: 0,
          textTransform: 'capitalize',
          color: '#f1dbaa'
        }}
      >
        {stats.dominant_emotion}
      </p>
    </div>
    
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}
    >
      <div
        style={{
          background: '#4d4c7d',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #f1dbaa'
        }}
      >
        <p style={{ fontSize: '0.9rem', color: '#e9d5da', margin: '0 0 0.5rem 0' }}>
          Total Entries
        </p>
        <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#f1dbaa' }}>
          {stats.total_entries}
        </p>
      </div>
      
      <div
        style={{
          background: '#4d4c7d',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #f1dbaa'
        }}
      >
        <p style={{ fontSize: '0.9rem', color: '#e9d5da', margin: '0 0 0.5rem 0' }}>
          Our average confidence:
        </p>
        <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#f1dbaa' }}>
          {(stats.average_confidence * 100).toFixed(0)}%
        </p>
      </div>
    </div>

    <div
      style={{
        background: '#4d4c7d',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #f1dbaa'
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: '600', color: '#f1dbaa' }}>
        Emotion Breakdown
      </h3>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {Object.entries(stats.emotion_breakdown)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([emotion, data]) => (
            <div key={emotion}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {emotion}
                </span>
                <span style={{ color: '#e9d5da' }}>
                  {data.count} entries ({data.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  background: '#2e2952',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${data.percentage}%`,
                    background: '#f1dbaa'
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

}