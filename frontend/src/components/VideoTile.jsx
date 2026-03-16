import { useEffect, useRef } from 'react';
import { MicOff} from 'lucide-react';

export default function VideoTile({ stream, userName, isMuted, isCameraOff, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
        videoRef.current.srcObject = null; // force re-attach
        videoRef.current.srcObject = stream;
    }
    }, [stream, isCameraOff]); // add isCameraOff as a dependency

  return (
    <div style={styles.tile}>
      {/* Video element */}
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // always mute local to avoid echo
          style={styles.video}
        />
      ) : (
        <div style={styles.avatar}>
          <span style={styles.avatarText}>
            {userName?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
      )}

      {/* Name tag */}
      <div style={styles.nameTag}>
        <span>{isLocal ? `${userName} (You)` : userName}</span>
      </div>

      {/* Muted indicator */}
      {isMuted && (
        <div style={styles.mutedBadge}>
          <MicOff size={20} /> 
        </div>
      )}
    </div>
  );
}

const styles = {
  tile: {
    position: 'relative',
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #2a2a4a',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#827397',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: '2rem',
    color: '#fff',
    fontWeight: 'bold',
  },
  nameTag: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  mutedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(220,38,38,0.85)',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
  },
};