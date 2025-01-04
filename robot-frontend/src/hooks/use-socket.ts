import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

type Position = {
  j1: number;
  j2: number;
  j3: number;
  jz: number;
  s1: number;
  s2: number;
  s3: number;
  sz: number;
  xP: number;
  yP: number;
  zP: number;
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [positions, setPositions] = useState<Position>({
    j1: 0,
    j2: 0,
    j3: 0,
    jz: 0,
    s1: 0,
    s2: 0,
    s3: 0,
    sz: 0,
    xP: 0,
    yP: 0,
    zP: 0,
  });

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('current_position', (data: Position) => {
      setPositions(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('current_position');
      socketInstance.close();
    };
  }, []);

  return { socket, isConnected, positions };
};
