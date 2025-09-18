import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../services/api';
import toast from 'react-hot-toast';
import './TournamentLobby.css';

interface Room {
  id: string;
  name: string;
  players: any[];
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: string;
}

const TournamentLobby: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getRooms();
      setRooms(response.rooms);
    } catch (error) {
      toast.error('방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('방 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await tournamentAPI.createRoom({
        name: newRoomName,
        maxPlayers: 2
      });

      setRooms(prev => [response.room, ...prev]);
      setNewRoomName('');
      setShowCreateModal(false);
      toast.success('방이 생성되었습니다!');
      
      // 방 생성 후 즉시 해당 방으로 이동
      window.location.href = `/banpick/${response.room.id}`;
    } catch (error) {
      toast.error('방 생성에 실패했습니다.');
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await tournamentAPI.joinRoom(roomId);
      toast.success('방에 참여했습니다!');
      // Navigate to banpick room
      window.location.href = `/banpick/${roomId}`;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message === 'You are already in this room') {
        // 이미 방에 참여한 경우에도 이동 허용
        toast.success('이미 방에 참여되어 있습니다!');
        window.location.href = `/banpick/${roomId}`;
      } else {
        toast.error('방 참여에 실패했습니다.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#51cf66';
      case 'in-progress':
        return '#ffd43b';
      case 'completed':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '대기 중';
      case 'in-progress':
        return '진행 중';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="tournament-lobby">
      <header className="lobby-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="back-button">
              ← 대시보드로 돌아가기
            </Link>
            <h1>토너먼트 로비</h1>
            <p>방을 만들거나 참여하여 토너먼트를 시작하세요</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            방 만들기
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <div className="lobby-content">
          <div className="rooms-section">
            <h2>활성 방 목록</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>방 목록을 불러오는 중...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <h3>활성 방이 없습니다</h3>
                <p>새로운 방을 만들어 토너먼트를 시작해보세요!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  첫 번째 방 만들기
                </button>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <div key={room.id} className="room-card">
                    <div className="room-header">
                      <h3 className="room-name">{room.name}</h3>
                      <div 
                        className="room-status"
                        style={{ backgroundColor: getStatusColor(room.status) }}
                      >
                        {getStatusText(room.status)}
                      </div>
                    </div>
                    
                    <div className="room-info">
                      <div className="room-players">
                        <span className="info-label">플레이어:</span>
                        <span className="info-value">
                          {room.players.length}/{room.maxPlayers}
                        </span>
                      </div>
                      <div className="room-created">
                        <span className="info-label">생성일:</span>
                        <span className="info-value">
                          {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>

                    <div className="room-players-list">
                      {room.players.map((player) => (
                        <div key={player.id} className="player-item">
                          <div className="player-avatar">
                            {player.displayName?.charAt(0) || player.username.charAt(0)}
                          </div>
                          <span className="player-name">
                            {player.displayName || player.username}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="room-actions">
                      {room.status === 'waiting' && room.players.length < room.maxPlayers ? (
                        <button
                          onClick={() => joinRoom(room.id)}
                          className="btn btn-success"
                        >
                          참여하기
                        </button>
                      ) : room.status === 'in-progress' ? (
                        <button
                          onClick={() => joinRoom(room.id)}
                          className="btn btn-secondary"
                        >
                          관전하기
                        </button>
                      ) : (
                        <button
                          onClick={() => joinRoom(room.id)}
                          className="btn btn-secondary"
                          disabled
                        >
                          완료됨
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>새 방 만들기</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="roomName" className="form-label">
                  방 이름
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="form-input"
                  placeholder="예: 8강전 - A조"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                onClick={createRoom}
                className="btn btn-primary"
              >
                방 만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentLobby;