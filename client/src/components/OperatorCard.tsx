import React from 'react';
import './OperatorCard.css';

interface Operator {
  id: string;
  name: string;
  rarity: number;
  profession: string;
  subProfession: string;
  position: string;
  description: string;
  tags: string[];
  nation: string;
  image?: string;
}

interface OperatorCardProps {
  operator: Operator;
  onBan: () => void;
  onPick: () => void;
  canBan: boolean;
  canPick: boolean;
}

const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  onBan,
  onPick,
  canBan,
  canPick
}) => {
  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 6:
        return '#ff6b6b'; // Red
      case 5:
        return '#ffd43b'; // Yellow
      case 4:
        return '#51cf66'; // Green
      case 3:
        return '#74c0fc'; // Blue
      default:
        return '#6c757d'; // Gray
    }
  };

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity);
  };

  return (
    <div className={`operator-card rarity-${operator.rarity}`}>
      <div className="operator-image-container">
        <img 
          src={operator.image} 
          alt={operator.name}
          className="operator-image"
        />
        <div 
          className="rarity-indicator"
          style={{ backgroundColor: getRarityColor(operator.rarity) }}
        >
          {getRarityStars(operator.rarity)}
        </div>
      </div>
      
      <div className="operator-info">
        <h3 className="operator-name">{operator.name}</h3>
        <p className="operator-class">{operator.profession}</p>
        {operator.tags.length > 0 && (
          <div className="operator-tags">
            {operator.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="operator-actions">
        {canBan && (
          <button
            onClick={onBan}
            className="action-btn ban-btn"
            title="밴하기"
          >
            🚫 밴
          </button>
        )}
        {canPick && (
          <button
            onClick={onPick}
            className="action-btn pick-btn"
            title="픽하기"
          >
            ✅ 픽
          </button>
        )}
      </div>
    </div>
  );
};

export default OperatorCard;