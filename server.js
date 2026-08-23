const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const basePort = Number(process.env.PORT || 3000);
let jugadores = {};

const startServer = (port) => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  app.use(express.static(__dirname));

  io.on('connection', (socket) => {
    console.log('jugador conectado:', socket.id);
    socket.emit('jugadoresActuales', jugadores);

    socket.on('nuevoJugador', (datos) => {
      jugadores[socket.id] = {
        id: socket.id,
        nombre: datos?.nombre || 'jugador',
        x: Number(datos?.x) || 0,
        y: Number(datos?.y) || 0
      };
      socket.broadcast.emit('jugadorUnido', jugadores[socket.id]);
    });

    socket.on('mover', (pos) => {
      if (!jugadores[socket.id]) return;
      jugadores[socket.id].x = Number(pos?.x) || jugadores[socket.id].x;
      jugadores[socket.id].y = Number(pos?.y) || jugadores[socket.id].y;
      socket.broadcast.emit('jugadorMovido', jugadores[socket.id]);
    });

    socket.on('disconnect', () => {
      delete jugadores[socket.id];
      io.emit('jugadorDesconectado', socket.id);
    });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Puerto ${port} ocupado, intentando ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`servidor corriendo en puerto ${port}`);
  });
};

startServer(basePort);
