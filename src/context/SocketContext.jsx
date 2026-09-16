import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
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
