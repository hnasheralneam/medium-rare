import { Game } from "../../state.js";
import { pause, resume } from "../../script.js";
import { PlayerHandler } from "../playerHandler.js";
import { gameCommsLocal } from "./GameCommsLocal.js";
import { DisplayController } from "../displayController.js";
import { Order } from "../order.js";

export const gameCommsRemote = {
   paused: false,

   emitPlayerAction(player, action) {
      window.socket.emit("playerActed", {
         roomid: window.roomid,
         playerid: player.id,
         move: action,
         anim: player.anim
      });
   },

   emitInit() {
      window.socket.emit("initGameDetails", {
         roomid: window.roomid,
         levelName: window.levelName
      });
   },

   onInit(levelData) {
      Game.init(levelData);
      OrderHandler.init(levelData.menuOptions);
   },

   emitStartGame() {
      console.info("Starting remote game");

      window.socket.emit("initPlayers", {
         roomid: window.roomid,
         players: PlayerHandler.pendingPlayers
      });
      if (window.isLeader) {
         window.socket.emit("startGame", {
            roomid: window.roomid
         });
      }
   },


   onStart() {
      Game.start();
   },

   emitPause() {
      window.socket.emit("pause", { roomid: window.roomid });
   },
   emitResume() {
      window.socket.emit("resume", { roomid: window.roomid });
   },
   onPause() {
      this.paused = true;
      pause();
   },
   onResume() {
      this.paused = false;
      resume();
   },
   isPaused() {
      return this.paused;
   },

   onCellChanged(index, cell) {
      Game.grid.setCell(index, cell);
   },

   onRedrawGrid() {
      gameCommsLocal.onRedrawGrid();
   },

   emitCreatePlayer(player) {
      gameCommsLocal.emitCreatePlayer(player);
   },

   onGameEnd(stats) {
      Game.end(stats);
   },
   onIncreaseScore(score) {
      DisplayController.updatePoints(score);
   },
   onUpdateTime(timeSeconds) {
      DisplayController.updateTime(timeSeconds);
   },



   emitPlayerAdded(id, sprite, pos) {
      window.socket.emit("addPlayer", {
         roomid: window.roomid,
         id: id,
         sprite: sprite,
         pos: pos
      });
   },
   emitPlayerRemoved(id) {
      window.socket.emit("removePlayer", {
         roomid: window.roomid,
         id: id
      });
   },

   updateTickAnim(id, anim) {
      window.socket.emit("updatePlayerAnimState", {
         roomid: window.roomid,
         id: id,
         anim: anim
      });
   },

   emitFailOrder(number) {
      window.socket.emit("failOrder", {
         roomid: window.roomid,
         number: number
      });
   },
   onCreateOrder(data) {
      let newOrder = new Order(data);
   },
   onFilledOrder(number) {
      gameCommsLocal.onFilledOrder(number);
   }
}