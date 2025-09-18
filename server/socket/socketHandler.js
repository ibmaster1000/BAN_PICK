const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);
    console.log('Socket auth:', socket.handshake.auth);

    // Authenticate user
    socket.on('authenticate', async (token) => {
      try {
        console.log('Authenticating socket with token:', token ? 'Token provided' : 'No token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded, userId:', decoded.userId);
        
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          console.log('User not found for ID:', decoded.userId);
          socket.emit('error', 'User not found');
          return;
        }

        if (!user.isActive) {
          console.log('User account deactivated:', user.username);
          socket.emit('error', 'Account is deactivated');
          return;
        }

        socket.userId = user._id;
        socket.user = user;
        socket.emit('authenticated', { user });
        console.log('User authenticated:', user.username, 'ID:', user._id);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('error', 'Invalid token');
      }
    });

    // Join room
    socket.on('joinRoom', async (roomId) => {
      try {
        console.log(`User ${socket.user?.username} attempting to join room ${roomId}`);
        
        if (!socket.userId) {
          console.log('User not authenticated');
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId)
          .populate('players', 'username profile.displayName')
          .populate('banPickState.currentPlayer', 'username profile.displayName');

        if (!room) {
          console.log(`Room ${roomId} not found`);
          socket.emit('error', 'Room not found');
          return;
        }

        console.log(`Room found: ${room.name}, players: ${room.players.length}`);
        console.log(`Room players (raw):`, room.players);

        // 사용자 ID 비교 (문자열로 변환하여 비교)
        const userIdStr = socket.userId.toString();
        const roomPlayerIds = room.players.map(playerId => playerId.toString());
        
        console.log(`Socket user ID: ${socket.userId}`);
        console.log(`Socket user ID (string): ${userIdStr}`);
        console.log(`Room player IDs (strings):`, roomPlayerIds);
        console.log(`User in room check:`, roomPlayerIds.includes(userIdStr));
        
        if (!roomPlayerIds.includes(userIdStr)) {
          console.log(`User ${userIdStr} not in room ${roomId}`);
          socket.emit('error', 'You are not in this room');
          return;
        }

        socket.join(roomId);
        socket.currentRoom = roomId;

        socket.emit('roomJoined', room);
        socket.to(roomId).emit('playerJoined', socket.user);
        
        console.log(`User ${socket.user.username} successfully joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    // Leave room
    socket.on('leaveRoom', async (roomId) => {
      try {
        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId);
        if (room) {
          room.removePlayer(socket.userId);
          
          if (room.players.length === 0) {
            await Room.findByIdAndDelete(roomId);
          } else {
            await room.save();
          }

          socket.to(roomId).emit('playerLeft', socket.userId);
        }

        socket.leave(roomId);
        socket.currentRoom = null;
        socket.emit('roomLeft');
        
        console.log(`User ${socket.user.username} left room ${roomId}`);
      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('error', 'Failed to leave room');
      }
    });

    // Start ban pick
    socket.on('startBanPick', async (roomId) => {
      try {
        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (!room.hasPlayer(socket.userId)) {
          socket.emit('error', 'You are not in this room');
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', 'Ban pick has already started');
          return;
        }

        if (room.players.length < 2) {
          socket.emit('error', 'Need at least 2 players to start');
          return;
        }

        room.initializeBanPick();
        await room.save();

        const populatedRoom = await Room.findById(room._id)
          .populate('players', 'username profile.displayName')
          .populate('banPickState.currentPlayer', 'username profile.displayName');

        io.to(roomId).emit('banPickStarted', populatedRoom);
        
        console.log(`Ban pick started in room ${roomId}`);
      } catch (error) {
        console.error('Start ban pick error:', error);
        socket.emit('error', 'Failed to start ban pick');
      }
    });

    // Ban operator
    socket.on('banOperator', async (data) => {
      try {
        const { roomId, operatorId } = data;

        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (!room.hasPlayer(socket.userId)) {
          socket.emit('error', 'You are not in this room');
          return;
        }

        if (room.status !== 'in-progress') {
          socket.emit('error', 'Ban pick is not in progress');
          return;
        }

        if (room.banPickState.currentPlayer.toString() !== socket.userId.toString()) {
          socket.emit('error', 'It is not your turn');
          return;
        }

        if (room.banPickState.phase !== 'draft-ban' && room.banPickState.phase !== 'group-ban') {
          socket.emit('error', 'Cannot ban in current phase');
          return;
        }

        const operator = room.banPickState.availableOperators.find(op => op.id === operatorId);
        if (!operator) {
          socket.emit('error', 'Operator not found or already banned/picked');
          return;
        }

        // Add to banned operators
        room.banPickState.bannedOperators.push(operator);
        
        // Remove from available operators
        room.banPickState.availableOperators = room.banPickState.availableOperators.filter(
          op => op.id !== operatorId
        );

        // Add to turn history
        room.banPickState.turnHistory.push({
          player: socket.userId,
          action: 'ban',
          operator: operator,
          timestamp: new Date()
        });

        // Check if phase should change
        if (room.banPickState.phase === 'draft-ban') {
          room.banPickState.draftBans.push(operator);
          
          if (room.banPickState.draftBans.length >= 4) {
            room.banPickState.phase = 'draft-pick';
          } else {
            room.switchTurn();
          }
        } else if (room.banPickState.phase === 'group-ban') {
          room.banPickState.groupBans.push(operator);
          
          if (room.banPickState.groupBans.length >= 4) {
            room.banPickState.phase = 'group-pick';
          } else {
            room.switchTurn();
          }
        }

        await room.save();

        const populatedRoom = await Room.findById(room._id)
          .populate('players', 'username profile.displayName')
          .populate('banPickState.currentPlayer', 'username profile.displayName');

        io.to(roomId).emit('operatorBanned', { operator, playerId: socket.userId });
        io.to(roomId).emit('banPickStateUpdated', populatedRoom);
        
        console.log(`Operator ${operator.name} banned by ${socket.user.username} in room ${roomId}`);
      } catch (error) {
        console.error('Ban operator error:', error);
        socket.emit('error', 'Failed to ban operator');
      }
    });

    // Pick operator
    socket.on('pickOperator', async (data) => {
      try {
        const { roomId, operatorId } = data;

        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (!room.hasPlayer(socket.userId)) {
          socket.emit('error', 'You are not in this room');
          return;
        }

        if (room.status !== 'in-progress') {
          socket.emit('error', 'Ban pick is not in progress');
          return;
        }

        if (room.banPickState.currentPlayer.toString() !== socket.userId.toString()) {
          socket.emit('error', 'It is not your turn');
          return;
        }

        if (room.banPickState.phase !== 'draft-pick' && room.banPickState.phase !== 'group-pick') {
          socket.emit('error', 'Cannot pick in current phase');
          return;
        }

        const operator = room.banPickState.availableOperators.find(op => op.id === operatorId);
        if (!operator) {
          socket.emit('error', 'Operator not found or already banned/picked');
          return;
        }

        // Add to picked operators
        room.banPickState.pickedOperators.push(operator);
        
        // Remove from available operators
        room.banPickState.availableOperators = room.banPickState.availableOperators.filter(
          op => op.id !== operatorId
        );

        // Add to turn history
        room.banPickState.turnHistory.push({
          player: socket.userId,
          action: 'pick',
          operator: operator,
          timestamp: new Date()
        });

        // Check if phase should change
        if (room.banPickState.phase === 'draft-pick') {
          room.banPickState.draftPicks.push(operator);
          
          if (room.banPickState.draftPicks.length >= 4) {
            room.banPickState.phase = 'group-ban';
          } else {
            room.switchTurn();
          }
        } else if (room.banPickState.phase === 'group-pick') {
          room.banPickState.groupPicks.push(operator);
          
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

        io.to(roomId).emit('operatorPicked', { operator, playerId: socket.userId });
        io.to(roomId).emit('banPickStateUpdated', populatedRoom);
        
        if (room.banPickState.phase === 'completed') {
          io.to(roomId).emit('banPickCompleted', populatedRoom);
        }
        
        console.log(`Operator ${operator.name} picked by ${socket.user.username} in room ${roomId}`);
      } catch (error) {
        console.error('Pick operator error:', error);
        socket.emit('error', 'Failed to pick operator');
      }
    });

    // Set ready status
    socket.on('setReady', async (data) => {
      try {
        const { roomId, ready } = data;

        if (!socket.userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (!room.hasPlayer(socket.userId)) {
          socket.emit('error', 'You are not in this room');
          return;
        }

        // Update player ready status (this would need to be added to the Room model)
        // For now, just emit the ready status change
        socket.to(roomId).emit('playerReadyStatusChanged', { 
          playerId: socket.userId, 
          ready 
        });
        
        console.log(`Player ${socket.user.username} ready status changed to ${ready} in room ${roomId}`);
      } catch (error) {
        console.error('Set ready error:', error);
        socket.emit('error', 'Failed to set ready status');
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        if (socket.currentRoom && socket.userId) {
          const room = await Room.findById(socket.currentRoom);
          if (room) {
            room.removePlayer(socket.userId);
            
            if (room.players.length === 0) {
              await Room.findByIdAndDelete(socket.currentRoom);
            } else {
              await room.save();
            }

            socket.to(socket.currentRoom).emit('playerLeft', socket.userId);
          }
        }
        
        console.log('User disconnected:', socket.id);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

module.exports = socketHandler;