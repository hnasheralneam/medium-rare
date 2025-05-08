import { Game } from "../../state.js";

export const serverCommsLocal = {
   giveServer(server) {
      this.server = server;
   },

   emitInitGame(levelName, levelData) {
      Game.getComms().onInit(levelData);
   },

   emitStarted() {
      Game.getComms().onStart();
   },

   emitGameEnded() {
      Game.getComms().onGameEnd();
   },

   emitRedraw() {
      Game.getComms().onRedrawGrid();
   },

   emitCreatePlayer(player) {
      Game.getComms().emitCreatePlayer(player);
   },

   emitUpdateTime(timeLeft) {
      Game.getComms().onUpdateTime(timeLeft);
   },

   emitSetCell(index, cell) {
      Game.getComms().onCellChanged(index, cell);
   },

   emitResume() {
      Game.getComms().onResume();
   },

   emitPause() {
      Game.getComms().onPause();
   },

   updatePlayer(player) {
      Game.updatePlayer(true, player);
   },

   emitCreateOrder(data) {
      Game.getComms().onCreateOrder(data);
   },
   emitFilledOrder(number) {
      Game.getComms().onFilledOrder(number);
   },

   emitIncreaseScore() {
      this.server.stats.score++;
      Game.getComms().onIncreaseScore();
   }
}