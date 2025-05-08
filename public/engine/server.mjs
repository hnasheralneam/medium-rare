import { Grid } from "./grid.mjs";
import { OrderHandler } from "./orderHandler.js";
import { Player } from "./player.js";

class Server {
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
      OrderHandler.init(this.level.menuOptions, this.comms);
      this.orderHandler = OrderHandler;

      return this.level;
   }

   initializePlayers(players) {
      for (const player of players) {
         // we know players are broken, will fix later
         // ACTUALLY IMPORTANT LINE
         this.addPlayer(player);
      }
   }

   addPlayer(pendingPlayer) {
      // this is related to comments in method above
      if (this.players.find(p => p.id === pendingPlayer.id)) {
         console.warn(`Server.addPlayer: Player with ID ${pendingPlayer.id} already exists. Skipping.`);
         return;
      }

      let player = new Player(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
      player.setType(pendingPlayer.type);
      this.players.push(player);
   }

   async start() {
      this.startTimer();
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
      let timeLeft = this.level.timeSeconds;
      this.comms.emitUpdateTime(timeLeft);
      this.timer = setInterval(() => {
         if (this.paused)
            return;
         timeLeft--;
         if (timeLeft <= 0) {
            this.end();
            return;
         }
         this.comms.emitUpdateTime(timeLeft);
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