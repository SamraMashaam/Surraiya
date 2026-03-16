import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { nanoid } from 'nanoid';
import socket from '../socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Production TURN — add your Metered.ca or Twilio credentials here later:
    // {
    //   urls: 'turn:relay.metered.ca:80',
    //   username: process.env.REACT_APP_TURN_USER,
    //   credential: process.env.REACT_APP_TURN_PASS,
    // },
  ],
};

export function useVideoCall({ user }) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]); // [{ socketId, stream, userName, userId, audio, video }]
  const [roomCode, setRoomCode] = useState('');
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const localStreamRef = useRef(null);
  const peersRef = useRef({});  // socketId → SimplePeer instance

  // ─── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('room-joined', ({ existingPeers, roomCode }) => {
      setRoomCode(roomCode);
      const stream = localStreamRef.current;
      console.log('[room-joined] existing peers:', existingPeers.length, '| stream:', stream?.id);

      existingPeers.forEach(({ socketId, userId, userName }) => {
        console.log('[room-joined] creating initiator peer for:', socketId, '| stream:', stream?.id, '| tracks:', stream?.getTracks().map(t => t.kind));
        const peer = createPeer(socketId, stream);
        peersRef.current[socketId] = peer;
        setPeers((prev) => [
          ...prev,
          { socketId, userId, userName, stream: null, audio: true, video: true },
        ]);
      });
  });

    socket.on('peer-joined', ({ socketId, userId, userName }) => {
      // They will send us an offer — just add them to the list for now
      setPeers((prev) => {
        if (prev.find((p) => p.socketId === socketId)) return prev;
        return [...prev, { socketId, userId, userName, stream: null, audio: true, video: true }];
      });
    });

    socket.on('signal-offer', ({ offer, fromSocketId, fromUserId, fromUserName }) => {
      // A peer is initiating — we respond with an answer
      const peer = receivePeer(fromSocketId, localStreamRef.current);
      peersRef.current[fromSocketId] = peer;
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === fromSocketId
            ? { ...p, userId: fromUserId, userName: fromUserName }
            : p
        )
      );
      peer.signal(offer);
    });

    socket.on('signal-answer', ({ answer, fromSocketId }) => {
      peersRef.current[fromSocketId]?.signal(answer);
    });

    socket.on('signal-ice', ({ candidate, fromSocketId }) => {
      peersRef.current[fromSocketId]?.signal(candidate);
    });

    socket.on('peer-left', ({ socketId }) => {
      peersRef.current[socketId]?.destroy();
      delete peersRef.current[socketId];
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on('peer-media-state', ({ socketId, audio, video }) => {
      setPeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, audio, video } : p))
      );
    });

    socket.on('room-full', () => {
      setError('This room is full (max 4 participants).');
      cleanup();
    });

    socket.on('room-not-found', () => {
      setError('Room not found. Check the code and try again.');
      cleanup();
    });

    return () => {
      cleanup();
      socket.off('room-joined');
      socket.off('peer-joined');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice');
      socket.off('peer-left');
      socket.off('peer-media-state');
      socket.off('room-full');
      socket.off('room-not-found');
      socket.disconnect();
    };
  }, []);

  // ─── Get local camera & mic ──────────────────────────────────────────────────
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream; // set ref immediately
      setLocalStream(stream);
      console.log('[getMedia] stream ready:', stream.id, '| tracks:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (err) {
      console.error('[getMedia] video+audio failed:', err.name, err.message);
      if (err.name === 'NotReadableError' || err.name === 'NotFoundError' || err.name === 'AbortError') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          console.warn('[getMedia] falling back to audio-only');
          localStreamRef.current = audioStream; // set ref immediately
          setLocalStream(audioStream);
          setIsCameraOff(true);
          return audioStream;
        } catch (audioErr) {
          console.error('[getMedia] audio-only also failed:', audioErr.name, audioErr.message);
          setError(`Could not access camera/microphone: ${audioErr.name} — ${audioErr.message}`);
          throw audioErr;
        }
      }
      setError(`Could not access camera/microphone: ${err.name} — ${err.message}`);
      throw err;
    }
  };

  const getDisplayName = useCallback(() => {
    if (user?.name) return user.name;
    // fallback — read directly from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      return stored?.name || stored?.username || stored?.email || 'Anonymous';
    } catch {
      return 'Anonymous';
    }
  }, [user]);

  const createRoom = useCallback(async () => {
    setError('');
    try {
      const stream = await getMedia();
      if (!stream) return;

      localStreamRef.current = stream;
      const code = nanoid(8).toUpperCase();
      socket.emit('join-room', {
        roomCode: code,
        userId: user?._id,
        userName: getDisplayName(),
        isCreating: true, // tells backend to create the room
      });
      setInCall(true);
    } catch (_) {}
  }, [user, getDisplayName]);

  const joinRoom = useCallback(async (code) => {
    setError('');
    if (!code?.trim()) {
      setError('Please enter a room code.');
      return;
    }
    try {
      const stream = await getMedia();
      if (!stream) return;

      localStreamRef.current = stream;
      socket.emit('join-room', {
        roomCode: code.trim().toUpperCase(),
        userId: user?._id,
        userName: getDisplayName(),
        isCreating: false, // tells backend to verify room exists first
      });
      setInCall(true);
    } catch (_) {}
  }, [user, getDisplayName]);

  // ─── Leave the call ──────────────────────────────────────────────────────────
  const leaveCall = useCallback(() => {
    socket.emit('leave-room');
    cleanup();
  }, []);

  // ─── Toggle mute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
    socket.emit('media-state', { audio: !newMuted, video: !isCameraOff });
  }, [isMuted, isCameraOff]);

  // ─── Toggle camera ────────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newCameraOff = !isCameraOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !newCameraOff));
    setIsCameraOff(newCameraOff);
    socket.emit('media-state', { audio: !isMuted, video: !newCameraOff });
  }, [isCameraOff, isMuted]);

  function createPeer(targetSocketId, stream) {
    console.log('[createPeer] initiating to:', targetSocketId, '| stream:', stream?.id, '| tracks:', stream?.getTracks().map(t => t.kind));

    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream,
      config: ICE_SERVERS,
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // receive video even if we can't send it
      },
    });

    peer.on('signal', (data) => {
      console.log('[createPeer] signal type:', data.type || 'candidate');
      if (data.type === 'offer') {
        socket.emit('signal-offer', { targetSocketId, offer: data });
      } else if (data.type === 'answer') {
        socket.emit('signal-answer', { targetSocketId, answer: data });
      } else if (data.candidate) {
        socket.emit('signal-ice', { targetSocketId, candidate: data });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('[createPeer] got remote stream:', remoteStream.id, '| tracks:', remoteStream.getTracks().map(t => t.kind));
      setPeers((prev) =>
        prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p))
      );
    });

    peer.on('connect', () => console.log('[createPeer] peer CONNECTED to:', targetSocketId));
    peer.on('error', (err) => console.error('[createPeer] error:', err));

    return peer;
  }

  function receivePeer(fromSocketId, stream) {
    console.log('[receivePeer] receiving from:', fromSocketId, '| stream:', stream?.id, '| tracks:', stream?.getTracks().map(t => t.kind));

    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      stream,
      config: ICE_SERVERS,
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // receive video even if we can't send it
      },
    });

    peer.on('signal', (data) => {
      console.log('[receivePeer] signal type:', data.type || 'candidate');
      if (data.type === 'answer') {
        socket.emit('signal-answer', { targetSocketId: fromSocketId, answer: data });
      } else if (data.candidate) {
        socket.emit('signal-ice', { targetSocketId: fromSocketId, candidate: data });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('[receivePeer] got remote stream:', remoteStream.id, '| tracks:', remoteStream.getTracks().map(t => t.kind));
      setPeers((prev) =>
        prev.map((p) => (p.socketId === fromSocketId ? { ...p, stream: remoteStream } : p))
      );
    });

    peer.on('connect', () => console.log('[receivePeer] peer CONNECTED to:', fromSocketId));
    peer.on('error', (err) => console.error('[receivePeer] error:', err));

    return peer;
  }

  // ─── Internal: clean up everything ───────────────────────────────────────────
  function cleanup() {
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setPeers([]);
    setInCall(false);
    setRoomCode('');
    setIsMuted(false);
    setIsCameraOff(false);
  }

  return {
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
  };
}