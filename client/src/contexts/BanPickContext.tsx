import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { operatorService, Operator } from '../services/operatorService';

// Operator 인터페이스는 operatorService에서 import

interface Player {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isReady: boolean;
  squad: Operator[];
  bannedOperators: Operator[];
}

interface BanPickState {
  phase: 'waiting' | 'draft-ban' | 'draft-pick' | 'group-ban' | 'group-pick' | 'completed';
  currentPlayer: string | null;
  turnTimeLeft: number;
  draftBans: Operator[];
  draftPicks: Operator[];
  groupBans: Operator[];
  groupPicks: Operator[];
  availableOperators: Operator[];
  bannedOperators: Operator[];
  pickedOperators: Operator[];
}

interface Room {
  id: string;
  name: string;
  players: Player[];
  banPickState: BanPickState;
  settings: {
    draftTimeLimit: number;
    groupTimeLimit: number;
    maxPlayers: number;
  };
  createdAt: string;
}

interface BanPickContextType {
  socket: Socket | null;
  currentRoom: Room | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  startBanPick: () => void;
  banOperator: (operatorId: string) => void;
  pickOperator: (operatorId: string) => void;
  setReady: (ready: boolean) => void;
  loading: boolean;
}

const BanPickContext = createContext<BanPickContextType | undefined>(undefined);

export const useBanPick = () => {
  const context = useContext(BanPickContext);
  if (context === undefined) {
    throw new Error('useBanPick must be used within a BanPickProvider');
  }
  return context;
};

interface BanPickProviderProps {
  children: ReactNode;
}

export const BanPickProvider: React.FC<BanPickProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Initializing socket with token:', token ? 'Token exists' : 'No token');
    
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      // 인증 토큰 전송
      if (token) {
        newSocket.emit('authenticate', token);
      }
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data.user.username, 'ID:', data.user.id);
      setIsAuthenticated(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('roomJoined', (room: Room) => {
      console.log('Room joined successfully:', room);
      setCurrentRoom(room);
      toast.success('방에 입장했습니다!');
    });

    newSocket.on('roomLeft', () => {
      setCurrentRoom(null);
      toast.success('방에서 나갔습니다.');
    });

    newSocket.on('playerJoined', (player: Player) => {
      setCurrentRoom(prev => prev ? {
        ...prev,
        players: [...prev.players, player]
      } : null);
      toast.success(`${player.displayName}님이 입장했습니다.`);
    });

    newSocket.on('playerLeft', (playerId: string) => {
      setCurrentRoom(prev => prev ? {
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      } : null);
      toast('플레이어가 나갔습니다.');
    });

    newSocket.on('banPickStarted', (room: Room) => {
      setCurrentRoom(room);
      toast.success('밴픽이 시작되었습니다!');
    });

    newSocket.on('operatorBanned', (data: { operator: Operator, playerId: string }) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        const updatedRoom = { ...prev };
        updatedRoom.banPickState.bannedOperators.push(data.operator);
        updatedRoom.banPickState.availableOperators = updatedRoom.banPickState.availableOperators.filter(
          op => op.id !== data.operator.id
        );
        
        return updatedRoom;
      });
      toast(`${data.operator.name}이(가) 밴되었습니다.`);
    });

    newSocket.on('operatorPicked', (data: { operator: Operator, playerId: string }) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        
        const updatedRoom = { ...prev };
        updatedRoom.banPickState.pickedOperators.push(data.operator);
        updatedRoom.banPickState.availableOperators = updatedRoom.banPickState.availableOperators.filter(
          op => op.id !== data.operator.id
        );
        
        return updatedRoom;
      });
      toast(`${data.operator.name}이(가) 픽되었습니다.`);
    });

    newSocket.on('turnChanged', (data: { currentPlayer: string, timeLeft: number }) => {
      setCurrentRoom(prev => prev ? {
        ...prev,
        banPickState: {
          ...prev.banPickState,
          currentPlayer: data.currentPlayer,
          turnTimeLeft: data.timeLeft
        }
      } : null);
    });

    newSocket.on('banPickCompleted', (room: Room) => {
      setCurrentRoom(room);
      toast.success('밴픽이 완료되었습니다!');
    });

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
      toast.error(error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (roomId: string) => {
    if (socket) {
      console.log('Attempting to join room:', roomId);
      socket.emit('joinRoom', roomId);
    } else {
      console.error('Socket not available for joining room');
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', currentRoom.id);
    }
  };

  const startBanPick = () => {
    if (socket && currentRoom) {
      socket.emit('startBanPick', currentRoom.id);
    }
  };

  const banOperator = (operatorId: string) => {
    if (socket && currentRoom) {
      socket.emit('banOperator', { roomId: currentRoom.id, operatorId });
    }
  };

  const pickOperator = (operatorId: string) => {
    if (socket && currentRoom) {
      socket.emit('pickOperator', { roomId: currentRoom.id, operatorId });
    }
  };

  const setReady = (ready: boolean) => {
    if (socket && currentRoom) {
      socket.emit('setReady', { roomId: currentRoom.id, ready });
    }
  };

  const value: BanPickContextType = {
    socket,
    currentRoom,
    isConnected,
    isAuthenticated,
    joinRoom,
    leaveRoom,
    startBanPick,
    banOperator,
    pickOperator,
    setReady,
    loading
  };

  return (
    <BanPickContext.Provider value={value}>
      {children}
    </BanPickContext.Provider>
  );
};