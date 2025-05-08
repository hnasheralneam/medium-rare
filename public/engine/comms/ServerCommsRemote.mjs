export const serverCommsRemote = {
   giveIoRoomid(io, roomid, server) {
      this.io = io;
      this.roomid = roomid;
      this.server = server;
   },

   emitInitGame(levelName, levelData) {
      this.io.in(this.roomid).emit("gameInitialized", {
         levelName: levelName,
         levelData: levelData
      });
   },

   emitStarted() {
      this.io.in(this.roomid).emit("gameStarted");
   },



   emitGameEnded(stats) {
      this.io.in(this.roomid).emit("gameEnded", stats);
   },

   emitRedraw() {
      this.io.in(this.roomid).emit("requestRedraw");
   },

   emitCreatePlayer(player) {
      this.io.in(this.roomid).emit("createPlayer", {
         player: player
      });
   },

   emitUpdateTime(timeLeft) {
      this.io.in(this.roomid).emit("updateTime", {
         timeLeft: timeLeft
      });
   },

   emitSetCell(index, cell) {
      this.io.in(this.roomid).emit("setCell", {
         index: index,
         cell: cell
      });
   },

   emitResume() {
      this.io.in(this.roomid).emit("resume");
   },

   emitPause() {
      this.io.in(this.roomid).emit("pause");
   },

   updatePlayer(player) {
      this.io.in(this.roomid).emit("updatePlayer", player);
   },

   emitCreateOrder(data) {
      this.io.in(this.roomid).emit("createOrder", data);
   },
   emitFilledOrder(number) {
      this.io.in(this.roomid).emit("filledOrder", number);
   },

   emitIncreaseScore() {
      this.server.stats.score++;
      this.io.in(this.roomid).emit("increaseScore", this.server.stats.score);
   }
}