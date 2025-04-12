const express = require("express");
const app = express();
const http = require("http");
require("ejs");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);
const uuid = require("uuid");

const port = process.env.PORT || 3030;

app.use(express.static("new"));
app.use(express.static("public"));
app.use(express.static("assets"));
app.use("/scripts", express.static(__dirname + "/public/scripts/"));
app.use("/item/", express.static(__dirname + "/assets/items"));
app.use("/resources/", express.static(__dirname + "/resources"));
app.set("view engine", "ejs");



// Basic page loading
app.get("/", (_req, res) => {
    res.render("home");
});

app.get("/play/:level", (req, res) => {
    res.render("game", {
        multiplayer: false,
        level: req.params.level
    });
});

app.get("/play", (req, res) => {
    res.render("game", {
        multiplayer: true
    });
});




// Multiplayer
let rooms = [];
io.on("connection", (socket) => {
    socket.on("test latency", () => {
        socket.emit("latency tested");
    });

    let userData = {}
    socket.on("user data updated", (userInfo, oldSocketId) => {
        userData = userInfo;

        let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
        if (indexInRooms == -1) {
            console.error("Room does not exist!");
            return;
        }
        let indexInUsers = rooms[indexInRooms]["users"].findIndex(user => user.socketid == oldSocketId);
        if (indexInUsers != -1) rooms[indexInRooms]["users"][indexInUsers] = userData;
        io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
    });


    socket.on("disconnect", () => {
        if (userData.usertype == "leader") {
            let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
            if (indexInRooms == -1) {
                console.error("Room does not exist!");
                return;
            }
            io.in(rooms[indexInRooms]["info"].name).emit("leader left lobby", rooms[indexInRooms]["users"]);
        }
        else if (userData.location == "waiting room") {
            let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
            let leaderData = rooms[indexInRooms]["users"].filter(obj => obj.usertype == "leader");
            io.to(leaderData[0].socketid).emit("user in waiting room left", socket.id);
        }
        else if (userData.location == "lobby") {
            let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
            if (indexInRooms == -1) {
                console.error("Room does not exist!");
                return;
            }
            let indexInUsers = rooms[indexInRooms]["users"].findIndex(user => user.socketid == userData.socketid);
            if (indexInUsers != -1) rooms[indexInRooms]["users"].splice(indexInUsers, 1);
            io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
        }
    });



    socket.on("create room", () => {
        let roomid = uuid.v4();
        rooms.push({
            info: {
                name: roomid,
                code: Math.floor(100000 + Math.random() * 900000),
                open: true
            },
            users: []
        });
        socket.emit("room created", {
            socketid: socket.id,
            roomname: roomid,
            usertype: "leader"
        });
    });
    socket.on("get roomcode", (roomid) => {
        let indexInRooms = rooms.findIndex(room => room.info.name == roomid);
        let room = rooms[indexInRooms];
        if (typeof(room) == "undefined") {
            socket.emit("room closed", room);
            return;
        }
        let roomcode = room.info.code;

        socket.emit("here is roomcode", roomcode);
    });
    socket.on("get socketid", () => {
        socket.emit("here is socketid", socket.id);
    });

    socket.on("join room", (roomcode) => {
        let room = rooms.find(room => room.info.code == roomcode);
        if (room && (room.info.open == true)) {
            socket.emit("joined room", {
                socketid: socket.id,
                roomname: room.info.name,
                usertype: "player"
            });
        }
        else if (room) socket.emit("no such room", "room is closed");
        else socket.emit("no such room", "room does not exist");
    });

    socket.on("leaderConnectingToRoom", (userInfo) => {
        let indexInRooms = rooms.findIndex(room => room.info.name === userInfo.roomname);
        if (indexInRooms == -1) {
            console.error("Room does not exist!");
            return;
        }

        rooms[indexInRooms]["users"].push(userInfo);

        socket.join(userInfo.roomname);
        io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
    });
    socket.on("player connecting to room", (userInfo) => {
        socket.join(userInfo.roomname);
        io.in(userInfo.roomname).emit("someone in waiting room", userInfo);
    });
    socket.on("player joining lobby", (userInfo, socketid) => {
        // Adds user to socket room
        let indexInRooms = rooms.findIndex(room => room.info.name === userInfo.roomname);
        if (indexInRooms == -1) {
            console.error("Room does not exist!");
            return;
        }

        socket.join(userInfo.roomname);

        // Sends to all in room
        io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
    });

    socket.on("let in", (newUser) => {
        // Finds room and adds new user's data
        let indexInRooms = rooms.findIndex(room => room.info.name === newUser.roomname);
        rooms[indexInRooms]["users"].push(newUser);

        // Respond only to socket in waiting room
        io.to(newUser.socketid).emit("you were let in", rooms[indexInRooms]["info"]["name"]);
    });
    socket.on("kick", (newUser) => {
        let indexInRooms = rooms.findIndex(room => room.info.name === newUser.roomname);
        let indexInUsers = rooms[indexInRooms]["users"].findIndex(user => user.socketid == newUser.socketid);
        rooms[indexInRooms]["users"].splice(indexInUsers, 1);

        // Sends only to socket to be kicked out
        io.to(newUser.socketid).emit("you were kicked out");
        // Sends to all in room
        io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
    });

    // Lobby chat
    socket.on("lobby chat message", (messageInfo, room) => {
        io.in(room).emit("lobby chat message", messageInfo);
    });
















    // Actual code stuff
    // "load" the game before actually starting
    socket.on("initGameDetails", ({ roomid, levelName, grid }) => {
        let index = rooms.findIndex(room => room.info.name == roomid);
        // if (!rooms[index]) return;
        rooms[index]["data"] = {
            paused: true,
            level: levelName,
            grid: grid,
            players: []
        };
        io.in(roomid).emit("gameInitialized", {
            levelName: rooms[index]["data"]["level"]
        });
    });
    socket.on("startGame", ({ roomid, levelName }) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;
        startGameTimer(roomid, () => { io.in(roomid).emit("gameOver"); });
        io.in(roomid).emit("gameStarted", {
            levelName: rooms[index]["data"]["level"]
        });
    });
    socket.on("pause", ({ roomid, paused }) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;

        setPauseState(roomid, paused);
        io.in(roomid).emit("pause", {
            paused: paused,
            timeSeconds: rooms[index]["data"]["timeSeconds"]
        });
    });


    // grids/cells
    socket.on("getGridData", (roomid, callback) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;
        callback(rooms[index]["data"]["grid"]);
    });
    socket.on("setGridData", ({roomid, grid}) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;
        rooms[index]["data"]["grid"] = grid;
    });
    socket.on("setCellData", ({ roomid, cell, index }) => {
        let roomIndex = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[roomIndex]) return;
        rooms[roomIndex]["data"]["grid"][index] = cell;
    });


    // players
    socket.on("addPlayer", ({roomid, id, sprite, pos}) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;
        let player = {
            id: id,
            sprite: sprite,
            pos: pos,
            lastMove: ""
        };
        rooms[index]["data"]["players"].push(player);
        io.in(roomid).emit("playerAdded", player);
    });
    socket.on("getPlayers", (roomid, callback) => {
        let index = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[index]) return;
        callback({
            players: rooms[index]["data"]["players"]
        });
    });
    socket.on("playerMoved", ({ roomid, playerid, move }) => {
        let roomIndex = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[roomIndex]) return;
        let playerIndex = rooms[roomIndex]["data"]["players"].findIndex(player => player.id === playerid);
        rooms[roomIndex]["data"]["players"][playerIndex].lastMove = move;
        io.in(roomid).emit("movePlayer", rooms[roomIndex]["data"]["players"][playerIndex]);
    });
    socket.on("setPlayer", ({ roomid, id, data }) => {
        let roomIndex = rooms.findIndex(room => room.info.name === roomid);
        if (!rooms[roomIndex]) return;

        io.in(roomid).emit("givePlayerItem", {
            id: id,
            item: data.item
        });
    });
});

app.get("/multi/:roomname", (req, res) => {
    let roomname = req.params.roomname;
    res.render("lobby");
});

app.get("/multi/:roomname/waiting-room", (req, res) => {
    res.render("waiting");
});

function startGameTimer(roomid, gameOverCallback) {
    let roomIndex = rooms.findIndex(room => room.info.name === roomid);
    if (!roomIndex) return;
    let timeLeft = rooms[roomIndex]["data"]["timeSeconds"];
    rooms[roomIndex]["data"]["timer"] = setInterval(() => {
        if (rooms[roomIndex]["data"]["paused"]) return;
        if (timeLeft <= 0) {
            // this.end();
            clearInterval(rooms[roomIndex]["data"]["timer"]);
            gameOverCallback();
            return;
        }
        timeLeft--;
    }, 1000);
}

function setPauseState(roomid, state) {
    let roomIndex = rooms.findIndex(room => room.info.name === roomid);
    if (!roomIndex || !state) return;
    rooms[roomIndex]["data"]["paused"] = state;
}


// Start server
server.listen(port, () => {
    console.info("Medium Rare active on port " + port);
});
