import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  phase: string;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, isActive, phase }) => {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (displayTime <= 5) return '#ff6b6b'; // Red
    if (displayTime <= 10) return '#ffd43b'; // Yellow
    return '#51cf66'; // Green
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'draft-ban':
        return '드래프트 밴';
      case 'draft-pick':
        return '드래프트 픽';
      case 'group-ban':
        return '그룹 밴';
      case 'group-pick':
        return '그룹 픽';
      default:
        return '밴픽';
    }
  };

  return (
    <div className={`timer-container ${isActive ? 'active' : 'inactive'}`}>
      <div className="timer-header">
        <h3>{getPhaseText()} 시간</h3>
        {isActive && (
          <div className="turn-indicator">
            <div className="turn-dot"></div>
            <span>당신의 차례</span>
          </div>
        )}
      </div>
      
      <div className="timer-display">
        <div 
          className="timer-circle"
          style={{ 
            '--progress': `${(displayTime / 20) * 100}%`,
            '--color': getTimerColor()
          } as React.CSSProperties}
        >
          <div className="timer-text">
            {formatTime(displayTime)}
          </div>
        </div>
      </div>

      <div className="timer-status">
        {isActive ? (
          <p className="status-active">
            선택 시간이 {displayTime}초 남았습니다
          </p>
        ) : (
          <p className="status-inactive">
            상대방의 차례입니다
          </p>
        )}
      </div>
    </div>
  );
};

export default Timer;