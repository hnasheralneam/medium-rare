// this is only for pre-game players!
import { Game } from "./game.js";

let createdTouchPlayer = false;
window.addEventListener("gamepadconnected", gamepadPlayerConnectionListener);
document.body.addEventListener("keydown", keyboardPlayerConnectionListener);
document.body.addEventListener("touchstart", touchPlayerConnectionListener);
function gamepadPlayerConnectionListener(e) {
   PlayerHandler.addGamepadPlayer(e.gamepad.index);
   let controllerStartGame = setInterval(() => {
      if (Game.keydownHandle) clearInterval(controllerStartGame);
      const gamepad = navigator.getGamepads()[e.gamepad.index];
      if (gamepad === null) {
         clearInterval(controllerStartGame);
         return;
      }
      if (gamepad.buttons[1].pressed) {
         window.attemptStartingGame();
         clearInterval(controllerStartGame);
      };
   }, 30);
}
function keyboardPlayerConnectionListener(e) {
   const key = e.code;
   switch (key) {
      case "KeyW":
      case "KeyA":
      case "KeyS":
      case "KeyD":
         PlayerHandler.addKeyboardPlayer(1);
         break;
      case "ArrowUp":
      case "ArrowLeft":
      case "ArrowDown":
      case "ArrowRight":
         PlayerHandler.addKeyboardPlayer(0);
         break;
   }
}
function touchPlayerConnectionListener() {
   if (window.innerHeight < 800) requestFullscreen();
   if (createdTouchPlayer) return;
   createdTouchPlayer = true;
   const id = window.crypto.randomUUID();
   let touchPad = document.createElement("div");
   touchPad.classList.add("touchpad");
   touchPad.innerHTML = `
      <button class="interact" onclick="window.game.handleTouchInput('interact', '${id}')">&#8900;</button>
   `;
   [{ dir: "up", arrow: "&#8673;" }, { dir: "left", arrow: "&#8672;" }, { dir: "right", arrow: "&#8674;" }, { dir: "down", arrow: "&#8675;" }].forEach(({ dir, arrow }) => {
      let element = document.createElement("button");
      element.classList.add("direction");
      element.classList.add(dir);
      element.innerHTML = arrow;
      let handler = () => {
         Game.handleTouchInput(dir, id);
      };
      element.addEventListener("touchstart", handler);
      touchPad.append(element);
   });
   document.querySelector(".touchpad-container").append(touchPad);
   PlayerHandler.addTouchPlayer(id);
}

function getRandomSprite() {
   return playerSprites[Math.floor(Math.random() * playerSprites.length)];
}

let inputMaps = [{
   ArrowUp: "up",
   ArrowDown: "down",
   ArrowLeft: "left",
   ArrowRight: "right",
   Period: "interact"
}, {
   KeyW: "up",
   KeyA: "left",
   KeyS: "down",
   KeyD: "right",
   KeyQ: "interact",
   KeyE: "interact"
}];
let playerSprites = ["phil", "bill", "frill", "still", "remi"];


export const PlayerHandler = {
   pendingPlayers: [],
   playerIndex: 0,

   getPlayerCount() {
      return this.pendingPlayers.length;
   },
   getNextPos() {
      let pos = Game.level.playerPositions[this.playerIndex] || Game.level.playerPositions[0];
      this.playerIndex++;
      return pos;
   },

   gameStarted() {
      window.removeEventListener("gamepadconnected", gamepadPlayerConnectionListener);
      document.body.addEventListener("keydown", keyboardPlayerConnectionListener);
      document.body.removeEventListener("touchstart", touchPlayerConnectionListener);
   },

   addGamepadPlayer(index) {
      let id = window.crypto.randomUUID();
      let pendingPlayer = {
         type: "gamepad",
         sprite: getRandomSprite(),
         index: index,
         id: id,
         pos: this.getNextPos()
      };
      this.pendingPlayers.push(pendingPlayer);
      window.updatePlayersOnPregameDisplay();
      this.emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
   },
   addKeyboardPlayer(inputMapIndex) {
      let id = window.crypto.randomUUID();
      let inputMap = inputMaps[inputMapIndex];
      let playerWithMapExists = this.pendingPlayers.find((player) => player.inputMap == inputMap);
      if (!playerWithMapExists) {
         let pendingPlayer = {
            type: "keyboard",
            sprite: getRandomSprite(),
            inputMap: inputMap,
            id: id,
            mapIndex: inputMapIndex,
            pos: this.getNextPos()
         };
         this.pendingPlayers.push(pendingPlayer);
         window.updatePlayersOnPregameDisplay();
         this.emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
      }
   },
   addTouchPlayer(id) {
      let pendingPlayer = {
         type: "touch",
         sprite: getRandomSprite(),
         id: id,
         pos: this.getNextPos()
      };
      this.pendingPlayers.push(pendingPlayer);
      window.updatePlayersOnPregameDisplay();
      this.emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
   },
   addRemotePlayer(remotePlayer) {
      let existingPlayer = this.pendingPlayers.find((player) => player.id == remotePlayer.id);
      if (!existingPlayer) {
         let player = {
            type: "remote",
            sprite: remotePlayer.sprite,
            id: remotePlayer.id,
            pos: remotePlayer.pos
         }
         this.playerIndex++;
         this.pendingPlayers.push(player);
         window.updatePlayersOnPregameDisplay();
      }
   },

   removePlayer(player) {
      let index = this.pendingPlayers.indexOf(player);
      let removedPos = this.pendingPlayers[index].pos;
      this.pendingPlayers.splice(index, 1);
      window.updatePlayersOnPregameDisplay();
      this.emitPlayerRemoved(player.id);
      for (let i = this.pendingPlayers.length - 1; i > index; i--) {
         this.pendingPlayers[i].pos = this.pendingPlayers[i - 1].pos;
      }
      this.pendingPlayers[index].pos = removedPos;
      this.playerIndex--;
   },

   emitPlayerAdded(id, sprite, pos) {
      if (window.multiplayer) {
         window.socket.emit("addPlayer", {
            roomid: window.roomid,
            id: id,
            sprite: sprite,
            pos: pos
         });
      }
   },
   emitPlayerRemoved(id) {
      if (window.multiplayer) {
         window.socket.emit("removePlayer", {
            roomid: window.roomid,
            id: id
         });
      }
   }
}
window.playerHandler = PlayerHandler;


function requestFullscreen() {
   const element = document.documentElement;

   if (element.requestFullscreen) {
      element.requestFullscreen();
   } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
   } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
   }
}
