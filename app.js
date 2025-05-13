#!/usr/bin/env node

import express from "express";
const app = express();
import { createServer as _createServer } from "http";
import "ejs";
const server = _createServer(app);
import { readFile } from "fs/promises";
import { join } from "path";

import { Server } from "socket.io";
const io = new Server(server);
import { v4 } from "uuid";

const port = process.env.PORT || 3030;

const dirname = import.meta.dirname;

app.use(express.static("new"));
app.use(express.static("public"));
app.use(express.static("assets"));
app.use("/item/", express.static(dirname + "/assets/items"));
app.use("/small-items/", express.static(dirname + "/assets/small-items"));
app.use("/resources/", express.static(dirname + "/resources"));
app.set("view engine", "ejs");

import { createServer } from "./public/engine/server.mjs";
import { serverCommsRemote } from "./public/engine/comms/ServerCommsRemote.mjs";


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
let rooms = []; // absoluetly the best, most scalable way
function getOpenRooms() {
   return rooms.filter((room) => room.info.open).filter((room) => !room.info.started);
}

io.on("connection", (socket) => {
   socket.on("test latency", () => {
      socket.emit("latency tested");
   });

   let userData = {}
   socket.on("user data updated", (userInfo, oldSocketId) => {
      userData = userInfo;

      let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
      if (indexInRooms == -1) return; // room does not exist
      let indexInUsers = rooms[indexInRooms]["users"].findIndex(user => user.socketid == oldSocketId);
      if (indexInUsers != -1) rooms[indexInRooms]["users"][indexInUsers] = userData;
      io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
   });


   socket.on("disconnect", () => {
      if (userData.usertype == "leader") {
         let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
         if (indexInRooms == -1) return; // room does not exist
         io.in(rooms[indexInRooms]["info"].name).emit("leader left lobby", rooms[indexInRooms]["users"]);
         io.in("openroomlisteners").emit("room removed", rooms[indexInRooms]["info"]["name"]);
      }
      else if (userData.location == "waiting room") {
         let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
         let leaderData = rooms[indexInRooms]["users"].filter(obj => obj.usertype == "leader");
         io.to(leaderData[0].socketid).emit("user in waiting room left", socket.id);
      }
      else if (userData.location == "lobby") {
         let indexInRooms = rooms.findIndex(room => room.info.name === userData.roomname);
         if (indexInRooms == -1) return; // room does not exist
         let indexInUsers = rooms[indexInRooms]["users"].findIndex(user => user.socketid == userData.socketid);
         if (indexInUsers != -1) rooms[indexInRooms]["users"].splice(indexInUsers, 1);
         io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
      }
   });


   socket.on("get roomcode", (roomid) => {
      let indexInRooms = rooms.findIndex(room => room.info.name == roomid);
      let room = rooms[indexInRooms];
      if (typeof (room) == "undefined") {
         socket.emit("room closed", room);
         return;
      }
      let roomcode = room.info.code;

      socket.emit("here is roomcode", roomcode);
   });
   socket.on("get socketid", () => {
      socket.emit("here is socketid", socket.id);
   });



   socket.on("create room", (isOpen) => {
      let roomid = v4();
      let newRoom = {
         info: {
            name: roomid,
            code: Math.floor(100000 + Math.random() * 900000),
            open: isOpen, // as in open to anyone, false means join only with roomcode
            started: false
         },
         users: [],
         data: {}
      };
      rooms.push(newRoom);
      socket.emit("room created", {
         socketid: socket.id,
         roomname: roomid,
         usertype: "leader"
      });
   });
   socket.on("join room", (roomcode) => {
      let room = rooms.find(room => room.info.code == roomcode);
      if (room && !room.info.started) {
         socket.emit("joined room", {
            socketid: socket.id,
            roomname: room.info.name,
            usertype: "player"
         });
         socket.leave("openroomlisteners");
      }
      else if (room) {
         // if (room.info.open == false) socket.emit("no such room", "room is closed");
         if (room.info.started) socket.emit("no such room", "game already started");
      }
      else socket.emit("no such room", "room does not exist");
   });
   socket.on("find room", (socketid) => {
      socket.join("openroomlisteners");
      io.to(socketid).emit("have open rooms", getOpenRooms());


      // what it should do is add person to a socket room for listening for open rooms
      // it will initially send them all the currently open rooms
      // then when a room is closed/opened they will be alerted

      // other
   });



   socket.on("leaderConnectingToRoom", (userInfo) => {
      let indexInRooms = rooms.findIndex(room => room.info.name === userInfo.roomname);
      if (indexInRooms == -1) return; // room does not exist

      rooms[indexInRooms]["users"].push(userInfo);

      socket.join(userInfo.roomname);
      io.in(rooms[indexInRooms]["info"].name).emit("users in lobby updated", rooms[indexInRooms]["users"]);
      if (rooms[indexInRooms]["info"]["open"]) io.in("openroomlisteners").emit("room added", rooms[indexInRooms]);
   });
   socket.on("player connecting to room", (userInfo) => {
      socket.join(userInfo.roomname);
      io.in(userInfo.roomname).emit("someone in waiting room", userInfo);
   });
   socket.on("player joining lobby", (userInfo, socketid) => {
      // Adds user to socket room
      let indexInRooms = rooms.findIndex(room => room.info.name === userInfo.roomname);
      if (indexInRooms == -1) return; // room does not exist

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
   socket.on("reject", (newUser) => {
      // Respond only to socket in waiting room
      io.to(newUser.socketid).emit("you were rejected");
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





   // =========================================
   // Actual code stuff
   // =========================================
   // "load" the game before actually starting
   socket.on("initGameDetails", async ({ roomid, levelName }) => {
      let index = rooms.findIndex(room => room.info.name == roomid);
      if (index === -1) return;
      try {
         // get level data
         const filePath = join(dirname, "resources", "levels", `${levelName}.json`);
         const fileContent = await readFile(filePath, "utf-8");
         const levelData = JSON.parse(fileContent);

         // create server
         const roomServer = createServer(serverCommsRemote);
         roomServer.getComms().giveIoRoomid(io, roomid, roomServer);
         roomServer.init(levelName, levelData);

         // Store server instance and level data in the room
         rooms[index]["data"] = {
            server: roomServer,
            levelName: levelName
         };

      } catch (error) {
         console.error(`Error initializing game:`, error);
      }
      rooms[index]["info"]["started"] = true;
      if (rooms[index]["info"]["open"]) io.in("openroomlisteners").emit("room removed", rooms[index]["info"]["name"]);
   });
   socket.on("removeGame", ({ roomid }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms.splice(index, 1);
   });

   socket.on("initPlayers", ({ roomid, players }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].initializePlayers(players);
   });

   socket.on("startGame", ({ roomid }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].start();
   });

   socket.on("playerActed", ({ roomid, playerid, move, anim }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].handlePlayerAction(playerid, move, anim);
   });

   socket.on("updatePlayerAnimState", ({ roomid, id, anim }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].updatePlayerAnimState(id, anim);
   });

   socket.on("pause", ({ roomid }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].pause();
   });
   socket.on("resume", ({ roomid }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].resume();
   });

   socket.on("failOrder", ({ roomid, number }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].orderHandler.closeOrder(number, true);
   });



   // players
   socket.on("addPlayer", ({ roomid, id, sprite, pos, type }) => {
      let player = {
         id: id,
         sprite: sprite,
         pos: pos,
         type: type
      };

      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].addPendingPlayer(id, sprite, pos, type);

      io.in(roomid).emit("playerAdded", player);
   });
   socket.on("updatePlayer", ({ roomid, id, sprite, pos }) => {
      let player = {
         id: id,
         sprite: sprite,
         pos: pos
      };

      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].updatePendingPlayer(id, sprite, pos);

      io.in(roomid).emit("playerUpdated", player);
   });
   socket.on("removePlayer", ({ roomid, id }) => {
      let index = rooms.findIndex(room => room.info.name === roomid);
      if (!rooms[index]) return;
      rooms[index]["data"]["server"].removePendingPlayer(id);

      io.in(roomid).emit("playerRemoved", id);
   });
});


// Start server
server.listen(port, () => {
   console.info("Medium Rare started on port " + port + " at " + (new Date()).toLocaleTimeString() + ".");
});
