import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';
import config from '../../../config';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_HOST = config.WS_URL;
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!SOCKET_HOST) return;

    const socketInstance = ClientIO(SOCKET_HOST, {
      transports: ['websocket'],
      path: config.WS_PATH + '/socket.io/',
    });

    socketRef.current = socketInstance;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
    }),
    [isConnected],
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};
