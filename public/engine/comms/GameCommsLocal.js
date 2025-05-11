import { getLevelData } from "../../levelDataParser.js";
import { pause, resume } from "../../script.js";
import { Game, Server } from "../../state.js";
import { DisplayController } from "../displayController.js";
import { Order } from "../order.js";
import { PlayerHandler } from "../playerHandler.js";

// on game, emitting to server
export const gameCommsLocal = {
   emitPlayerAction(player, action) {
      Server.handlePlayerAction(player.id, action, player.anim);
   },

   async emitInit() {
      let data = await getLevelData(window.levelName);
      Server.init(levelName, data);
   },

   onInit(levelData) {
      Game.init(levelData);
   },

   emitStartGame() {
      if (Game.started) return;
      Game.started = true;
      console.info("Starting local game");
      Server.initializePlayers(PlayerHandler.pendingPlayers);
      Server.start();
   },

   onStart() {
      Game.start();
   },

   emitPause() {
      Server.pause();
   },
   emitResume() {
      Server.resume();
   },
   onPause() {
      pause();
   },
   onResume() {
      resume();
   },
   isPaused() {
      return Server.paused;
   },

   onCellChanged(index, cell) {
      Game.grid.setCell(index, cell);
   },

   onRedrawGrid() {
      Game.notifyRedraw();
   },

   emitCreatePlayer(player) {
      Game.addPlayer(player);
   },

   onGameEnd() {
      Game.end({
         score: Server.stats.score,
         failedOrders: Server.orderHandler.failedOrders.length,
         completedOrders: Server.orderHandler.completedOrders.length
      });
   },
   onIncreaseScore() {
      DisplayController.updatePoints(Server.stats.score);
   },
   onUpdateTime(timeSeconds) {
      DisplayController.updateTime(timeSeconds);
   },



   emitPlayerAdded(id, sprite, pos) {
      Server.addPendingPlayer(id, sprite, pos);
   },
   emitPlayerUpdated(id, sprite, pos) {
      Server.updatePendingPlayer(id, sprite, pos);
   },
   emitPlayerRemoved(id) {
      Server.removePendingPlayer(id);
   },

   updateTickAnim(id, anim) {
      Server.updatePlayerAnimState(id, anim);
   },

   emitFailOrder(number) {
      Server.orderHandler.closeOrder(number, true);
   },
   onCreateOrder(data) {
      let newOrder = new Order(data);
   },
   onFilledOrder(number) {
      document.querySelector(`.order-${number}`).dispatchEvent(new MouseEvent("dblclick"));
      document.querySelector(`.order-${number}`).remove();
   }
}