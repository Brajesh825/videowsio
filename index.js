const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    if (rooms[roomId]) {
      rooms[roomId].push(userId);
    } else {
      rooms[roomId] = [userId];
    }

    socket.to(roomId).emit('user-connected', userId);
    socket.emit('existing-users', rooms[roomId]);

    socket.on('disconnect', () => {
      rooms[roomId] = rooms[roomId].filter(id => id !== userId);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
