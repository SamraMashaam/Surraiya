import VideoTile from './VideoTile';

export default function VideoGrid({ localStream, peers, localUser, isMuted, isCameraOff }) {
  const totalParticipants = 1 + peers.length; // local + remote

  return (
    <div style={getGridStyle(totalParticipants)}>
      {/* Local tile — always first */}
      <VideoTile
        stream={localStream}
        userName={localUser?.name || 'You'}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isLocal={true}
      />

      {/* Remote peer tiles */}
      {peers.map((peer) => (
        <VideoTile
          key={peer.socketId}
          stream={peer.stream}
          userName={peer.userName}
          isMuted={!peer.audio}
          isCameraOff={!peer.video}
          isLocal={false}
        />
      ))}
    </div>
  );
}

// Dynamically pick a CSS grid layout based on participant count
function getGridStyle(count) {
  const base = {
    display: 'grid',
    width: '100%',
    height: '100%',
    gap: '12px',
    padding: '12px',
    boxSizing: 'border-box',
    backgroundColor: '#0D1117',
  };

  if (count === 1) {
    return {
      ...base,
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    };
  }

  if (count === 2) {
    return {
      ...base,
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
    };
  }

  if (count === 3) {
    return {
      ...base,
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      // 3rd tile spans both columns on the second row
      gridTemplateAreas: `
        "a b"
        "c c"
      `,
    };
  }

  // 4 participants — 2x2 grid
  return {
    ...base,
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
  };
}