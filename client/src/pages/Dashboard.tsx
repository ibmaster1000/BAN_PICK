import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Team KEO 밴픽 시스템</h1>
            <p>토너먼트 밴픽 관리 시스템</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.profile.displayName?.charAt(0).toUpperCase() || user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.profile.displayName || user?.username}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>환영합니다, {user?.profile.displayName || user?.username}님!</h2>
            <p>토너먼트에 참여하고 밴픽을 진행해보세요.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-content">
                <div className="stat-number">{user?.tournamentStats.gamesPlayed || 0}</div>
                <div className="stat-label">플레이한 게임</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-number">{user?.tournamentStats.gamesWon || 0}</div>
                <div className="stat-label">승리한 게임</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{user?.tournamentStats.winRate || 0}%</div>
                <div className="stat-label">승률</div>
              </div>
            </div>
          </div>

          <div className="action-grid">
            <Link to="/lobby" className="action-card">
              <div className="action-icon">🏟️</div>
              <div className="action-content">
                <h3>토너먼트 로비</h3>
                <p>방을 만들거나 참여하여 토너먼트를 시작하세요</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <div className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h3>토너먼트 규칙</h3>
                <p>밴픽 규칙과 토너먼트 진행 방식을 확인하세요</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3>플레이어 목록</h3>
                <p>등록된 플레이어들을 확인하고 통계를 보세요</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <h3>설정</h3>
                <p>프로필과 계정 설정을 관리하세요</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>

          <div className="recent-activity">
            <h3>최근 활동</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🎯</div>
                <div className="activity-content">
                  <div className="activity-title">토너먼트 참여</div>
                  <div className="activity-time">방금 전</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🏆</div>
                <div className="activity-content">
                  <div className="activity-title">게임 승리</div>
                  <div className="activity-time">1시간 전</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;