const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rarity: {
    type: Number,
    required: true,
    enum: [3, 4, 5, 6]
  },
  class: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const banPickStateSchema = new mongoose.Schema({
  phase: {
    type: String,
    enum: ['waiting', 'draft-ban', 'draft-pick', 'group-ban', 'group-pick', 'completed'],
    default: 'waiting'
  },
  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  turnTimeLeft: {
    type: Number,
    default: 20
  },
  draftBans: [operatorSchema],
  draftPicks: [operatorSchema],
  groupBans: [operatorSchema],
  groupPicks: [operatorSchema],
  availableOperators: [operatorSchema],
  bannedOperators: [operatorSchema],
  pickedOperators: [operatorSchema],
  turnHistory: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['ban', 'pick']
    },
    operator: operatorSchema,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxPlayers: {
    type: Number,
    default: 2,
    min: 2,
    max: 8
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed'],
    default: 'waiting'
  },
  banPickState: banPickStateSchema,
  settings: {
    draftTimeLimit: {
      type: Number,
      default: 20
    },
    groupTimeLimit: {
      type: Number,
      default: 20
    },
    maxReserveTime: {
      type: Number,
      default: 120
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
roomSchema.index({ status: 1 });
roomSchema.index({ createdAt: -1 });

// Virtual for player count
roomSchema.virtual('playerCount').get(function() {
  return this.players.length;
});

// Method to check if room is full
roomSchema.methods.isFull = function() {
  return this.players.length >= this.maxPlayers;
};

// Method to check if user is in room
roomSchema.methods.hasPlayer = function(userId) {
  return this.players.some(playerId => playerId.toString() === userId.toString());
};

// Method to add player to room
roomSchema.methods.addPlayer = function(userId) {
  if (!this.hasPlayer(userId) && !this.isFull()) {
    this.players.push(userId);
    return true;
  }
  return false;
};

// Method to remove player from room
roomSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(playerId => playerId.toString() !== userId.toString());
};

// Method to initialize ban pick state
roomSchema.methods.initializeBanPick = function() {
  // Mock operator data - 실제로는 데이터베이스에서 가져와야 함
  const mockOperators = [
    { id: '1', name: '아미야', rarity: 6, class: '캐스터', image: '/api/placeholder/100/100', description: '중앙의 캐스터' },
    { id: '2', name: '실버애시', rarity: 6, class: '스나이퍼', image: '/api/placeholder/100/100', description: '원거리 스나이퍼' },
    { id: '3', name: '텍사스', rarity: 5, class: '가드', image: '/api/placeholder/100/100', description: '근접 가드' },
    { id: '4', name: '라플라스', rarity: 6, class: '가드', image: '/api/placeholder/100/100', description: '고급 가드' },
    { id: '5', name: '프로젝트 레드', rarity: 5, class: '어시스트', image: '/api/placeholder/100/100', description: '어시스트' },
    { id: '6', name: '블루포이즌', rarity: 5, class: '메디컬', image: '/api/placeholder/100/100', description: '메디컬' },
    { id: '7', name: '프로스트', rarity: 4, class: '서포터', image: '/api/placeholder/100/100', description: '서포터' },
    { id: '8', name: '스카디', rarity: 6, class: '가드', image: '/api/placeholder/100/100', description: '고급 가드' },
  ];

  this.banPickState = {
    phase: 'draft-ban',
    currentPlayer: this.players[0], // 첫 번째 플레이어부터 시작
    turnTimeLeft: this.settings.draftTimeLimit,
    draftBans: [],
    draftPicks: [],
    groupBans: [],
    groupPicks: [],
    availableOperators: mockOperators,
    bannedOperators: [],
    pickedOperators: [],
    turnHistory: []
  };

  this.status = 'in-progress';
};

// Method to get next player
roomSchema.methods.getNextPlayer = function() {
  const currentIndex = this.players.findIndex(playerId => 
    playerId.toString() === this.banPickState.currentPlayer.toString()
  );
  return this.players[(currentIndex + 1) % this.players.length];
};

// Method to switch turn
roomSchema.methods.switchTurn = function() {
  this.banPickState.currentPlayer = this.getNextPlayer();
  this.banPickState.turnTimeLeft = this.settings.draftTimeLimit;
};

// Ensure virtual fields are serialized
roomSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Room', roomSchema);