import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      auth: {
        token: getAuthToken(),
      },
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket.IO disconnected');
      setConnected(false);
    });

    newSocket.on('critical_alert', (data) => {
      console.warn('🚨 LIVE CRITICAL ALERT RECEIVED:', data);
      setLiveAlerts((prev) => [
        { id: Date.now(), title: 'CRITICAL BIN ALERT', message: data.message, timestamp: new Date(), type: 'CRITICAL' },
        ...prev,
      ]);
    });

    newSocket.on('worker_alert', (data) => {
      setLiveAlerts((prev) => [
        { id: Date.now(), title: 'WORKER ALERT', message: data.message, timestamp: new Date(), type: 'WORKER' },
        ...prev,
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const dismissAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, connected, liveAlerts, dismissAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
