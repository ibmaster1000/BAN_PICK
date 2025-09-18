const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Room = require('../models/Room');

const router = express.Router();

// @route   GET /api/tournament/rooms
// @desc    Get all tournament rooms
// @access  Private
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('players', 'username profile.displayName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      rooms: rooms.map(room => ({
        id: room._id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        createdAt: room.createdAt
      }))
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   POST /api/tournament/rooms
// @desc    Create a new tournament room
// @access  Private
router.post('/rooms', verifyToken, async (req, res) => {
  try {
    const { name, maxPlayers = 2 } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: 'Room name is required'
      });
    }

    console.log('Creating room with user ID:', req.user._id);
    
    const room = new Room({
      name: name.trim(),
      players: [req.user._id],
      maxPlayers,
      status: 'waiting',
      createdBy: req.user._id
    });

    await room.save();
    console.log('Room created with ID:', room._id, 'Players:', room.players);

    const populatedRoom = await Room.findById(room._id)
      .populate('players', 'username profile.displayName');

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: populatedRoom._id,
        name: populatedRoom.name,
        players: populatedRoom.players,
        maxPlayers: populatedRoom.maxPlayers,
        status: populatedRoom.status,
        createdAt: populatedRoom.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   GET /api/tournament/rooms/:roomId
// @desc    Get specific tournament room
// @access  Private
router.get('/rooms/:roomId', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('players', 'username profile.displayName');

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    res.json({
      room: {
        id: room._id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        banPickState: room.banPickState,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   POST /api/tournament/rooms/:roomId/join
// @desc    Join a tournament room
// @access  Private
router.post('/rooms/:roomId/join', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (room.players.includes(req.user._id)) {
      // 이미 방에 참여한 경우 성공으로 처리
      const populatedRoom = await Room.findById(req.params.roomId)
        .populate('players', 'username profile.displayName')
        .populate('banPickState.currentPlayer', 'username profile.displayName');

      return res.json({
        message: 'Already in room',
        room: {
          id: populatedRoom._id,
          name: populatedRoom.name,
          players: populatedRoom.players,
          maxPlayers: populatedRoom.maxPlayers,
          status: populatedRoom.status,
          banPickState: populatedRoom.banPickState,
          createdAt: populatedRoom.createdAt
        }
      });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        message: 'Room is full'
      });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({
        message: 'Room is not accepting new players'
      });
    }

    room.players.push(req.user._id);
    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .populate('players', 'username profile.displayName');

    res.json({
      message: 'Joined room successfully',
      room: {
        id: populatedRoom._id,
        name: populatedRoom.name,
        players: populatedRoom.players,
        maxPlayers: populatedRoom.maxPlayers,
        status: populatedRoom.status,
        banPickState: populatedRoom.banPickState,
        createdAt: populatedRoom.createdAt
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   POST /api/tournament/rooms/:roomId/leave
// @desc    Leave a tournament room
// @access  Private
router.post('/rooms/:roomId/leave', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    if (!room.players.includes(req.user._id)) {
      return res.status(400).json({
        message: 'You are not in this room'
      });
    }

    room.players = room.players.filter(playerId => playerId.toString() !== req.user._id.toString());
    
    // If no players left, delete the room
    if (room.players.length === 0) {
      await Room.findByIdAndDelete(req.params.roomId);
      return res.json({
        message: 'Left room successfully. Room deleted.'
      });
    }

    // Reset room status if game was in progress
    if (room.status === 'in-progress') {
      room.status = 'waiting';
      room.banPickState = null;
    }

    await room.save();

    res.json({
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;