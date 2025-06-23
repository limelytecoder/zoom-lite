const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

app.use(express.static('public'));

io.on('connection', socket => {
  users.push(socket.id);
  if (users.length === 2) {
    io.emit('both-users-connected');
  }

  socket.on('disconnect', () => {
    users = users.filter(id => id !== socket.id);
  });

  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('ice-candidate', data => socket.broadcast.emit('ice-candidate', data));
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
