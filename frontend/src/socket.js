import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL;

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export default socket;