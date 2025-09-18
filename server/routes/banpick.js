const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Room = require('../models/Room');

const router = express.Router();

// @route   POST /api/banpick/:roomId/start
// @desc    Start ban pick process
// @access  Private
router.post('/:roomId/start', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (!room.hasPlayer(req.user._id)) {
      return res.status(403).json({
        message: 'You are not in this room'
      });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({
        message: 'Ban pick has already started'
      });
    }

    if (room.players.length < 2) {
      return res.status(400).json({
        message: 'Need at least 2 players to start'
      });
    }

    room.initializeBanPick();
    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .populate('players', 'username profile.displayName')
      .populate('banPickState.currentPlayer', 'username profile.displayName');

    res.json({
      message: 'Ban pick started successfully',
      room: populatedRoom
    });
  } catch (error) {
    console.error('Start ban pick error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   POST /api/banpick/:roomId/ban
// @desc    Ban an operator
// @access  Private
router.post('/:roomId/ban', verifyToken, async (req, res) => {
  try {
    const { operatorId } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (!room.hasPlayer(req.user._id)) {
      return res.status(403).json({
        message: 'You are not in this room'
      });
    }

    if (room.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Ban pick is not in progress'
      });
    }

    if (room.banPickState.currentPlayer.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        message: 'It is not your turn'
      });
    }

    if (room.banPickState.phase !== 'draft-ban' && room.banPickState.phase !== 'group-ban') {
      return res.status(400).json({
        message: 'Cannot ban in current phase'
      });
    }

    const operator = room.banPickState.availableOperators.find(op => op.id === operatorId);
    if (!operator) {
      return res.status(400).json({
        message: 'Operator not found or already banned/picked'
      });
    }

    // Add to banned operators
    room.banPickState.bannedOperators.push(operator);
    
    // Remove from available operators
    room.banPickState.availableOperators = room.banPickState.availableOperators.filter(
      op => op.id !== operatorId
    );

    // Add to turn history
    room.banPickState.turnHistory.push({
      player: req.user._id,
      action: 'ban',
      operator: operator,
      timestamp: new Date()
    });

    // Check if phase should change
    const totalBans = room.banPickState.draftBans.length + room.banPickState.groupBans.length;
    const totalPicks = room.banPickState.draftPicks.length + room.banPickState.groupPicks.length;

    if (room.banPickState.phase === 'draft-ban') {
      room.banPickState.draftBans.push(operator);
      
      // Switch to draft pick after certain number of bans
      if (room.banPickState.draftBans.length >= 4) {
        room.banPickState.phase = 'draft-pick';
      } else {
        room.switchTurn();
      }
    } else if (room.banPickState.phase === 'group-ban') {
      room.banPickState.groupBans.push(operator);
      
      // Switch to group pick after certain number of bans
      if (room.banPickState.groupBans.length >= 4) {
        room.banPickState.phase = 'group-pick';
      } else {
        room.switchTurn();
      }
    }

    // Check if ban pick is completed
    if (totalBans >= 8 && totalPicks >= 8) {
      room.banPickState.phase = 'completed';
      room.status = 'completed';
    }

    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .populate('players', 'username profile.displayName')
      .populate('banPickState.currentPlayer', 'username profile.displayName');

    res.json({
      message: 'Operator banned successfully',
      room: populatedRoom
    });
  } catch (error) {
    console.error('Ban operator error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   POST /api/banpick/:roomId/pick
// @desc    Pick an operator
// @access  Private
router.post('/:roomId/pick', verifyToken, async (req, res) => {
  try {
    const { operatorId } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (!room.hasPlayer(req.user._id)) {
      return res.status(403).json({
        message: 'You are not in this room'
      });
    }

    if (room.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Ban pick is not in progress'
      });
    }

    if (room.banPickState.currentPlayer.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        message: 'It is not your turn'
      });
    }

    if (room.banPickState.phase !== 'draft-pick' && room.banPickState.phase !== 'group-pick') {
      return res.status(400).json({
        message: 'Cannot pick in current phase'
      });
    }

    const operator = room.banPickState.availableOperators.find(op => op.id === operatorId);
    if (!operator) {
      return res.status(400).json({
        message: 'Operator not found or already banned/picked'
      });
    }

    // Add to picked operators
    room.banPickState.pickedOperators.push(operator);
    
    // Remove from available operators
    room.banPickState.availableOperators = room.banPickState.availableOperators.filter(
      op => op.id !== operatorId
    );

    // Add to turn history
    room.banPickState.turnHistory.push({
      player: req.user._id,
      action: 'pick',
      operator: operator,
      timestamp: new Date()
    });

    // Check if phase should change
    const totalBans = room.banPickState.draftBans.length + room.banPickState.groupBans.length;
    const totalPicks = room.banPickState.draftPicks.length + room.banPickState.groupPicks.length;

    if (room.banPickState.phase === 'draft-pick') {
      room.banPickState.draftPicks.push(operator);
      
      // Switch to group ban after certain number of picks
      if (room.banPickState.draftPicks.length >= 4) {
        room.banPickState.phase = 'group-ban';
      } else {
        room.switchTurn();
      }
    } else if (room.banPickState.phase === 'group-pick') {
      room.banPickState.groupPicks.push(operator);
      
      // Complete ban pick after certain number of picks
      if (room.banPickState.groupPicks.length >= 4) {
        room.banPickState.phase = 'completed';
        room.status = 'completed';
      } else {
        room.switchTurn();
      }
    }

    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .populate('players', 'username profile.displayName')
      .populate('banPickState.currentPlayer', 'username profile.displayName');

    res.json({
      message: 'Operator picked successfully',
      room: populatedRoom
    });
  } catch (error) {
    console.error('Pick operator error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   GET /api/banpick/:roomId/state
// @desc    Get ban pick state
// @access  Private
router.get('/:roomId/state', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('players', 'username profile.displayName')
      .populate('banPickState.currentPlayer', 'username profile.displayName');

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (!room.hasPlayer(req.user._id)) {
      return res.status(403).json({
        message: 'You are not in this room'
      });
    }

    res.json({
      room: room
    });
  } catch (error) {
    console.error('Get ban pick state error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;