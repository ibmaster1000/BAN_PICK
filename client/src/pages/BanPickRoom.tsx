import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBanPick } from '../contexts/BanPickContext';
import OperatorCard from '../components/OperatorCard';
import Timer from '../components/Timer';
import PhaseIndicator from '../components/PhaseIndicator';
import { operatorService, Operator } from '../services/operatorService';
import './BanPickRoom.css';

const BanPickRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentRoom, joinRoom, leaveRoom, startBanPick, banOperator, pickOperator, setReady, isConnected, isAuthenticated } = useBanPick();
  
  const [availableOperators, setAvailableOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [bannedOperators, setBannedOperators] = useState<any[]>([]);
  const [pickedOperators, setPickedOperators] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'waiting' | 'draft-ban' | 'draft-pick' | 'group-ban' | 'group-pick' | 'completed'>('waiting');
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [filterRarity, setFilterRarity] = useState<number | 'all'>('all');
  const [filterProfession, setFilterProfession] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // 오퍼레이터 데이터 로드
    const operators = operatorService.getOperatorsForBanPick();
    setAvailableOperators(operators);
    setFilteredOperators(operators);

    return () => {
      leaveRoom();
    };
  }, []);

  // Socket.IO 연결 및 인증이 완료된 후 방에 참여
  useEffect(() => {
    if (isConnected && isAuthenticated && roomId && !currentRoom) {
      console.log('Joining room:', roomId);
      joinRoom(roomId);
    }
  }, [isConnected, isAuthenticated, roomId, currentRoom, joinRoom]);

  // 필터링 로직
  useEffect(() => {
    let filtered = availableOperators;

    // 성급 필터
    if (filterRarity !== 'all') {
      filtered = filtered.filter(op => op.rarity === filterRarity);
    }

    // 직업 필터
    if (filterProfession !== 'all') {
      filtered = filtered.filter(op => op.profession === filterProfession);
    }

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(op => 
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredOperators(filtered);
  }, [availableOperators, filterRarity, filterProfession, searchQuery]);

  useEffect(() => {
    if (currentRoom) {
      // Update local state based on room data
      setBannedOperators(currentRoom.banPickState?.bannedOperators || []);
      setPickedOperators(currentRoom.banPickState?.pickedOperators || []);
      setCurrentPhase(currentRoom.banPickState?.phase || 'waiting');
      setCurrentPlayer(currentRoom.banPickState?.currentPlayer || null);
      setTimeLeft(currentRoom.banPickState?.turnTimeLeft || 20);
      
      // Check if it's current user's turn
      setIsMyTurn(currentRoom.banPickState?.currentPlayer === user?.id);
    }
  }, [currentRoom, user]);

  const handleBanOperator = (operatorId: string) => {
    if (!isMyTurn || currentPhase !== 'draft-ban' && currentPhase !== 'group-ban') {
      return;
    }
    
    banOperator(operatorId);
  };

  const handlePickOperator = (operatorId: string) => {
    if (!isMyTurn || currentPhase !== 'draft-pick' && currentPhase !== 'group-pick') {
      return;
    }
    
    pickOperator(operatorId);
  };

  const handleStartBanPick = () => {
    if (currentRoom?.players.length === 2) {
      startBanPick();
    }
  };

  const handleSetReady = () => {
    setReady(true);
  };

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 'waiting':
        return '대기 중';
      case 'draft-ban':
        return '드래프트 밴';
      case 'draft-pick':
        return '드래프트 픽';
      case 'group-ban':
        return '그룹 밴';
      case 'group-pick':
        return '그룹 픽';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case 'waiting':
        return '모든 플레이어가 준비되면 밴픽을 시작할 수 있습니다.';
      case 'draft-ban':
        return '드래프트 밴 단계입니다. 상대방이 사용할 수 없는 오퍼레이터를 선택하세요.';
      case 'draft-pick':
        return '드래프트 픽 단계입니다. 자신의 팀에 사용할 오퍼레이터를 선택하세요.';
      case 'group-ban':
        return '그룹 밴 단계입니다. 추가로 밴할 오퍼레이터를 선택하세요.';
      case 'group-pick':
        return '그룹 픽 단계입니다. 최종 팀 구성을 완료하세요.';
      case 'completed':
        return '밴픽이 완료되었습니다. 게임을 시작할 수 있습니다.';
      default:
        return '';
    }
  };

  if (!currentRoom) {
    return (
      <div className="banpick-room">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>방 정보를 불러오는 중...</p>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <p>연결 상태: {isConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</p>
            <p>인증 상태: {isAuthenticated ? '✅ 인증됨' : '❌ 인증 안됨'}</p>
            <p>방 ID: {roomId}</p>
            <p>사용자: {user?.username}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="banpick-room">
      <header className="banpick-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/lobby')} className="back-button">
              ← 로비로 돌아가기
            </button>
            <h1>{currentRoom.name}</h1>
          </div>
          <div className="header-right">
            <div className="connection-status">
              <div className="status-indicator"></div>
              <span>연결됨</span>
            </div>
          </div>
        </div>
      </header>

      <main className="banpick-main">
        <div className="banpick-content">
          {/* Phase Indicator */}
          <PhaseIndicator
            phase={currentPhase}
            title={getPhaseTitle()}
            description={getPhaseDescription()}
          />

          {/* Timer */}
          {currentPhase !== 'waiting' && currentPhase !== 'completed' && (
            <Timer
              timeLeft={timeLeft}
              isActive={isMyTurn}
              phase={currentPhase}
            />
          )}

          {/* Players Section */}
          <div className="players-section">
            <div className="players-grid">
              {currentRoom.players.map((player: any, index: number) => (
                <div key={player.id} className={`player-card ${player.id === currentPlayer ? 'active' : ''}`}>
                  <div className="player-avatar">
                    {player.displayName?.charAt(0) || player.username.charAt(0)}
                  </div>
                  <div className="player-info">
                    <h3>{player.displayName || player.username}</h3>
                    <p>플레이어 {index + 1}</p>
                  </div>
                  <div className="player-status">
                    {player.isReady ? '✅ 준비됨' : '⏳ 대기 중'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            {currentPhase === 'waiting' && (
              <div className="waiting-actions">
                <button
                  onClick={handleSetReady}
                  className="btn btn-success"
                  disabled={currentRoom.players.find((p: any) => p.id === user?.id)?.isReady}
                >
                  준비 완료
                </button>
                {currentRoom.players.length === 2 && currentRoom.players.every((p: any) => p.isReady) && (
                  <button
                    onClick={handleStartBanPick}
                    className="btn btn-primary"
                  >
                    밴픽 시작
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Operators Section */}
          <div className="operators-section">
            <div className="operators-header">
              <h2>사용 가능한 오퍼레이터</h2>
              <div className="operators-count">
                {filteredOperators.length}명 표시 중
              </div>
            </div>

            {/* 필터 섹션 */}
            <div className="operators-filters">
              <div className="filter-group">
                <label>성급:</label>
                <select 
                  value={filterRarity} 
                  onChange={(e) => setFilterRarity(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="filter-select"
                >
                  <option value="all">전체</option>
                  <option value="6">6성</option>
                  <option value="5">5성</option>
                  <option value="4">4성</option>
                  <option value="3">3성</option>
                </select>
              </div>

              <div className="filter-group">
                <label>직업:</label>
                <select 
                  value={filterProfession} 
                  onChange={(e) => setFilterProfession(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">전체</option>
                  <option value="워리어">워리어</option>
                  <option value="스나이퍼">스나이퍼</option>
                  <option value="가드">가드</option>
                  <option value="디펜더">디펜더</option>
                  <option value="캐스터">캐스터</option>
                  <option value="메디컬">메디컬</option>
                  <option value="서포터">서포터</option>
                  <option value="스페셜리스트">스페셜리스트</option>
                </select>
              </div>

              <div className="filter-group">
                <label>검색:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="오퍼레이터 이름, 직업, 태그 검색..."
                  className="filter-input"
                />
              </div>
            </div>

            <div className="operators-grid">
              {filteredOperators.map((operator) => (
                <OperatorCard
                  key={operator.id}
                  operator={operator}
                  onBan={() => handleBanOperator(operator.id)}
                  onPick={() => handlePickOperator(operator.id)}
                  canBan={isMyTurn && (currentPhase === 'draft-ban' || currentPhase === 'group-ban')}
                  canPick={isMyTurn && (currentPhase === 'draft-pick' || currentPhase === 'group-pick')}
                />
              ))}
            </div>
          </div>

          {/* Banned/Picked Operators */}
          <div className="results-section">
            <div className="results-grid">
              <div className="result-card banned">
                <h3>밴된 오퍼레이터</h3>
                <div className="operators-list">
                  {bannedOperators.map((operator) => (
                    <div key={operator.id} className="operator-item">
                      <img src={operator.image} alt={operator.name} />
                      <span>{operator.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card picked">
                <h3>픽된 오퍼레이터</h3>
                <div className="operators-list">
                  {pickedOperators.map((operator) => (
                    <div key={operator.id} className="operator-item">
                      <img src={operator.image} alt={operator.name} />
                      <span>{operator.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BanPickRoom;