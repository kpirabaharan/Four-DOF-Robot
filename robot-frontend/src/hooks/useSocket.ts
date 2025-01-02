import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

type Position = {
  j1: number;
  j2: number;
  j3: number;
  jz: number;
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [positions, setPositions] = useState<Position>({
    j1: 0,
    j2: 0,
    j3: 0,
    jz: 0,
  });

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('current_angle', (data: Position) => {
      setPositions(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('current_angle');
      socketInstance.close();
    };
  }, []);

  return { socket, isConnected, positions };
};
