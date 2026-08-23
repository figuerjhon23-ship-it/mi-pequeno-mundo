const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.includes('*') ? true : allowedOrigins,
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((origin) => origin.trim()).filter(Boolean);
const players = new Map();

app.use(express.static(__dirname));

app.get('/health', (_req, res) => {
    res.json({ ok: true, players: players.size, port: PORT });
});

io.on('connection', (socket) => {
    players.set(socket.id, {
        id: socket.id,
        name: 'Explorador',
        x: 650,
        y: 650
    });

    socket.emit('currentPlayers', Object.fromEntries(players));
    socket.broadcast.emit('newPlayer', players.get(socket.id));

    socket.on('playerJoin', (data = {}) => {
        const player = players.get(socket.id);
        if (!player) return;
        player.name = String(data.name || 'Explorador').slice(0, 16);
        io.emit('playerUpdated', player);
    });

    socket.on('playerMovement', (movement = {}) => {
        const player = players.get(socket.id);
        if (!player) return;
        if (Number.isFinite(movement.x)) player.x = Math.max(0, Math.min(8000, movement.x));
        if (Number.isFinite(movement.y)) player.y = Math.max(0, Math.min(8000, movement.y));
        socket.broadcast.emit('playerMoved', player);
    });

    socket.on('disconnect', () => {
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Mi Pequeño Mundo online en http://localhost:${PORT}`);
});
