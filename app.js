const express = require("express");
const app = express();
const http = require("http");
const ejs = require("ejs");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);
const uuid = require("uuid");

const port = process.env.PORT || 8080;

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
            users: [],
            data: {
                paused: false,
                level: null,
                grid: null
            }
        });
        socket.emit("room created", {
            socketid: socket.id,
            roomname: roomid,
            usertype: "leader"
        });
    });
    // "load" the game before actually starting
    socket.on("init game data", ({roomid, levelName, grid}) => {
        let index = rooms.findIndex(room => room.info.name == roomid);
        rooms[index]["data"] = {
            paused: true,
            level: levelName,
            grid: grid
        }

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

    socket.on("leader connecting to room", (userInfo) => {
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
});

app.get("/multi/:roomname", (req, res) => {
    let roomname = req.params.roomname;
    res.render("lobby");
});

app.get("/multi/:roomname/waiting-room", (req, res) => {
    res.render("waiting");
});



// Start server
server.listen(port, () => {
    console.log("Medium Rare active on port " + port);
});
