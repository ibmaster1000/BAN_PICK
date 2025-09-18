import React from 'react';
import './PhaseIndicator.css';

interface PhaseIndicatorProps {
  phase: 'waiting' | 'draft-ban' | 'draft-pick' | 'group-ban' | 'group-pick' | 'completed';
  title: string;
  description: string;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase, title, description }) => {
  const getPhaseIcon = () => {
    switch (phase) {
      case 'waiting':
        return '⏳';
      case 'draft-ban':
        return '🚫';
      case 'draft-pick':
        return '✅';
      case 'group-ban':
        return '🚫';
      case 'group-pick':
        return '✅';
      case 'completed':
        return '🏆';
      default:
        return '❓';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'waiting':
        return '#6c757d';
      case 'draft-ban':
        return '#ff6b6b';
      case 'draft-pick':
        return '#51cf66';
      case 'group-ban':
        return '#ff6b6b';
      case 'group-pick':
        return '#51cf66';
      case 'completed':
        return '#ffd43b';
      default:
        return '#6c757d';
    }
  };

  const getPhaseSteps = () => {
    return [
      { key: 'waiting', label: '대기', icon: '⏳' },
      { key: 'draft-ban', label: '드래프트 밴', icon: '🚫' },
      { key: 'draft-pick', label: '드래프트 픽', icon: '✅' },
      { key: 'group-ban', label: '그룹 밴', icon: '🚫' },
      { key: 'group-pick', label: '그룹 픽', icon: '✅' },
      { key: 'completed', label: '완료', icon: '🏆' }
    ];
  };

  const steps = getPhaseSteps();
  const currentStepIndex = steps.findIndex(step => step.key === phase);

  return (
    <div className="phase-indicator">
      <div className="phase-header">
        <div 
          className="phase-icon"
          style={{ backgroundColor: getPhaseColor() }}
        >
          {getPhaseIcon()}
        </div>
        <div className="phase-info">
          <h2 className="phase-title">{title}</h2>
          <p className="phase-description">{description}</p>
        </div>
      </div>

      <div className="phase-progress">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`progress-step ${
                index <= currentStepIndex ? 'completed' : ''
              } ${index === currentStepIndex ? 'current' : ''}`}
            >
              <div className="step-icon">
                {index < currentStepIndex ? '✓' : step.icon}
              </div>
              <div className="step-label">{step.label}</div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${
                  index < currentStepIndex ? 'completed' : ''
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhaseIndicator;