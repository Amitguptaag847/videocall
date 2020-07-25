const express = require('express');
const http = require('http');
const socket = require('socket.io');
const path = require('path');
const haiku = require(path.join(__dirname,"utility", "haiku.js"));

const app = express();
const server = http.createServer(app);
const io = socket(server);

const users = {};

io.on('connection', socket => {
    if (!users[socket.id]) {
        const name = haiku();
        users[socket.id] = {
            socketId: socket.id,
            name: name
        };
    }
    socket.emit("yourId", users[socket.id]);
    io.sockets.emit("allUsers", users);
    socket.on('disconnect', () => {
        socket.removeAllListeners();
        delete users[socket.id];
        io.sockets.emit("allUsers", users);
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('incomingCall', { signal: data.signalData, from: data.from });
    });

    socket.on("acceptedCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });

    socket.on("disconnectCall", (data) => {
        io.to(data.to).emit("callDisconnect", data);  
    });
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static(path.join(__dirname, "client", "build")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});