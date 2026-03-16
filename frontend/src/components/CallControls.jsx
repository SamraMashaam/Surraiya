import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy } from 'lucide-react';

export default function CallControls({ isMuted, isCameraOff, onToggleMute, onToggleCamera, onLeave, roomCode }) {

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div style={styles.bar}>

      {/* Room code — left side */}
      <div style={styles.roomCode}>
        <span style={styles.roomCodeLabel}>Room Code</span>
        <span style={styles.roomCodeValue}>{roomCode}</span>
        <button style={styles.copyButton} onClick={handleCopyCode}>
          <Copy size={14} />
        </button>
      </div>

      {/* Controls — center */}
      <div style={styles.controls}>
        <button
          style={{ ...styles.controlButton, ...(isMuted ? styles.controlButtonActive : {}) }}
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          <span style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          style={{ ...styles.controlButton, ...(isCameraOff ? styles.controlButtonActive : {}) }}
          onClick={onToggleCamera}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          <span style={styles.controlLabel}>{isCameraOff ? 'Cam On' : 'Cam Off'}</span>
        </button>

        <button
          style={{ ...styles.controlButton, ...styles.leaveButton }}
          onClick={onLeave}
          title='Leave Call'
        >
          <PhoneOff size={20} />
          <span style={styles.controlLabel}>Leave</span>
        </button>
      </div>

      {/* Spacer — keeps controls centered */}
      <div style={styles.spacer} />

    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13131f',
    borderTop: '1px solid #2a2a4a',
    padding: '12px 24px',
    height: '70px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  roomCode: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,  // takes up left third
  },
  roomCodeLabel: {
    color: '#6b7280',
    fontSize: '0.8rem',
  },
  roomCodeValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    backgroundColor: '#1e1e3a',
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid #2a2a4a',
  },
  copyButton: {
    backgroundColor: 'transparent',
    border: '1px solid #4f46e5',
    color: '#818cf8',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,            // takes up center third
    justifyContent: 'center',  // centers the buttons
  },
  spacer: {
    flex: 1,            // takes up right third — mirrors the roomCode left side
  },
  controlButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: '#1e1e3a',
    border: '1px solid #2a2a4a',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    minWidth: '64px',
  },
  controlButtonActive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#dc2626',
  },
  leaveButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  controlLabel: {
    fontSize: '0.65rem',
    color: '#9ca3af',
  },
};