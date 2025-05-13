import { Grid } from "./grid.mjs";
import { OrderHandler } from "./orderHandler.js";
import { Player } from "./player.js";

class Server {
   pendingPlayers = [];
   players = [];
   level = null;
   grid = null;
   paused = false;
   stats = {
      score: 0
   };
   initialized = false;

   constructor(comms) {
      this.comms = comms;
   }

   getComms() {
      return this.comms;
   }

   async init(levelName, levelData) {
      this.level = levelData;
      this.grid = new Grid(this.level.width, this.level.height);
      this.grid.loadData(this.level.layout, this.level.extra, this.comms);
      this.initialized = true;
      this.comms.emitInitGame(levelName, this.level);
      return this.level;
   }

   initializePlayers() {
      for (const player of this.pendingPlayers) {
         this.addPlayer(player);
      }
   }

   addPendingPlayer(id, sprite, pos, type) {
      if (this.players.find(p => p.id === id)) {
         console.warn(`Player with ID ${id} already exists.`);
         return;
      }
      this.pendingPlayers.push({
         id: id,
         sprite: sprite,
         pos: pos,
         type: type
      });
   }

   updatePendingPlayer(id, sprite, pos) {
      let player = this.pendingPlayers.find(p => p.id === id);
      if (!player) return;
      player.sprite = sprite;
      player.pos = pos;
   }

   removePendingPlayer(id) {
      this.pendingPlayers = this.pendingPlayers.filter(p => p.id !== id);
   }

   addPlayer(pendingPlayer) {
      let player = new Player(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
      player.setType(pendingPlayer.type);
      this.players.push(player);
   }

   async start() {
      this.initializePlayers();
      this.startTimer();
      OrderHandler.init(this.level.menuOptions, this.comms, this);
      this.orderHandler = OrderHandler;
      this.comms.emitStarted();
   }

   end() {
      clearInterval(this.timer);
      this.comms.emitGameEnded({
         score: this.stats.score,
         failedOrders: this.orderHandler.failedOrders.length,
         completedOrders: this.orderHandler.completedOrders.length
      });
   }

   startTimer() {
      this.timeLeft = this.level.timeSeconds;
      this.comms.emitUpdateTime(this.timeLeft);
      this.timer = setInterval(() => {
         if (this.paused)
            return;
         this.timeLeft--;
         if (this.timeLeft <= 0) {
            this.end();
            return;
         }
         this.comms.emitUpdateTime(this.timeLeft);
      }, 1000);

   }

   resume() {
      this.paused = false;
      this.getComms().emitResume();
   }

   pause() {
      this.paused = true;
      this.getComms().emitPause();
   }
   getPlayerById(id) {
      return this.players.find(player => player.getId() === id);
   }



   // communication
   handlePlayerAction(playerid, action, anim) {
      if (this.paused) return;
      let player = this.getPlayerById(playerid);
      player.handleAction(action, this.grid, anim, (tile) => {
         this.handleCellChanged(tile);
      });
      this.comms.updatePlayer(player);
      // this.comms.updatePlayers(this.players);
   }
   handleCellChanged(cell) {
      // this won't work for remote, different objs. needs position as well, should be given when calling
      let index = this.grid.getCells().indexOf(cell);
      if (index == -1) return;
      this.comms.emitSetCell(index, cell);
      this.comms.emitRedraw();
   }
   updatePlayerAnimState(id, anim) {
      this.getPlayerById(id).anim = anim;
   }
}

let server = new Server();
export { server as Server };

export function createServer(comms) {
   return new Server(comms);
}