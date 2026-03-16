import { useState } from 'react';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoGrid from '../components/VideoGrid';
import CallControls from '../components/CallControls';

export default function VideoCall({ user }) {
  const [codeInput, setCodeInput] = useState('');

  const {
    localStream,
    peers,
    roomCode,
    inCall,
    error,
    isMuted,
    isCameraOff,
    createRoom,
    joinRoom,
    leaveCall,
    toggleMute,
    toggleCamera,
  } = useVideoCall({ user });

  // ─── In call UI ───────────────────────────────────────────────────────────────
  if (inCall) {
    return (
      <div style={styles.callContainer}>
        <div style={styles.gridWrapper}>
          <VideoGrid
            localStream={localStream}
            peers={peers}
            localUser={user}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
          />
        </div>
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onLeave={leaveCall}
          roomCode={roomCode}
        />
      </div>
    );
  }

  // ─── Lobby UI ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.lobby}>
      <div style={styles.card}>

        <h1 style={styles.title}>Video Call</h1>
        <p style={styles.subtitle}>Start a new call or join an existing one</p>

        {error && <div style={styles.error}>{error}</div>}

        {/* Create room */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>New Call</h2>
          <p style={styles.sectionDesc}>
            Generate a room code and share it with others to invite them.
          </p>
          <button style={styles.primaryButton} onClick={createRoom}>
            Create Room
          </button>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        {/* Join room */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Join a Call</h2>
          <p style={styles.sectionDesc}>
            Enter the room code you received to join an existing call.
          </p>
          <div style={styles.joinRow}>
            <input
              style={styles.input}
              type='text'
              placeholder='Enter room code'
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom(codeInput)}
              maxLength={8}
            />
            <button
              style={styles.primaryButton}
              onClick={() => joinRoom(codeInput)}
            >
              Join
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  // ── Call layout ──
  callContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0f0f1a',
    overflow: 'hidden',
  },
  gridWrapper: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Lobby layout ──
  lobby: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#2e2952',
  },
  card: {
    backgroundColor: '#13131f',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '460px',
  },
  title: {
    color: '#fff',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    margin: '0 0 32px 0',
  },
  error: {
    backgroundColor: '#7f1d1d',
    border: '1px solid #dc2626',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  section: {
    marginBottom: '8px',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 6px 0',
  },
  sectionDesc: {
    color: '#6b7280',
    fontSize: '0.85rem',
    margin: '0 0 14px 0',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: '12px',
  },
  dividerText: {
    color: '#4b5563',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    width: '100%',
    textAlign: 'center',
    borderTop: '1px solid #2a2a4a',
    lineHeight: '0',
    margin: '10px 0',
  },
  joinRow: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e3a',
    border: '1px solid #2a2a4a',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    letterSpacing: '0.1em',
    outline: 'none',
  },
};