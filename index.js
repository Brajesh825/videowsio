const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId); // Broadcast to everyone in the room

    if (rooms[roomId]) {
      rooms[roomId].push({ id: userId, socketId: socket.id });
    } else {
      rooms[roomId] = [{ id: userId, socketId: socket.id }];
    }

    const existingUsers = rooms[roomId].filter(user => user.id !== userId);
    socket.emit('existing-users', existingUsers);

    socket.on('disconnect', () => {
      const index = rooms[roomId].findIndex(user => user.socketId === socket.id);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
      }
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
