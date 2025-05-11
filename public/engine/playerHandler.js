// this is only for pre-game players!
import { DisplayController } from "./displayController.js";
import { attemptStartingGame, updatePlayersOnPregameDisplay } from "../script.js";
import { Game } from "../state.js";

let createdTouchPlayer = false;

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
         attemptStartingGame();
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
   if (createdTouchPlayer) return;
   createdTouchPlayer = true;
   const id = window.crypto.randomUUID();
   let touchPad = document.createElement("div");
   touchPad.classList.add("touchpad");
   touchPad.innerHTML = `
      <button class="interact">&#8900;</button>
   `;
   touchPad.querySelector(".interact").addEventListener("click", () => {
      Game.handleTouchInput("interact", id);
   });
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
   DisplayController.addTouchpad(touchPad);
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
let playerSprites = ["phil", "bill", "frill", "still", "jill", "remi"];


document.body.addEventListener("touchstart", (e) => {
   if (window.innerHeight < 760 || window.innerWidth < 500) {
      const element = document.documentElement;
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
   }
});

export const PlayerHandler = {
   pendingPlayers: [],
   playerIndex: 0,

   init(levelData) {
      this.levelData = levelData;
      window.addEventListener("gamepadconnected", gamepadPlayerConnectionListener);
      document.body.addEventListener("keydown", keyboardPlayerConnectionListener);
      document.body.addEventListener("touchstart", touchPlayerConnectionListener);
   },

   getPlayerCount() {
      return this.pendingPlayers.length;
   },
   getNextPos() {
      let pos = this.levelData.playerPositions[this.playerIndex] || this.levelData.playerPositions[0];
      this.playerIndex++;
      return pos;
   },

   stopAcceptingNewPlayers() {
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
      updatePlayersOnPregameDisplay();
      Game.getComms().emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
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
         updatePlayersOnPregameDisplay();
         Game.getComms().emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
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
      updatePlayersOnPregameDisplay();
      Game.getComms().emitPlayerAdded(id, pendingPlayer.sprite, pendingPlayer.pos);
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
         updatePlayersOnPregameDisplay();
      }
   },
   updateRemotePlayer(id, sprite, pos) {
      let player = this.pendingPlayers.find((obj) => obj.id == id);
      if (!player) return;
      player.sprite = sprite;
      player.pos = pos;
      updatePlayersOnPregameDisplay();
   },

   changePlayerSpriteNext(id, element) {
      let player = this.pendingPlayers.find((obj) => obj.id == id);
      let newSprite = playerSprites[playerSprites.indexOf(player.sprite) + 1];
      if (!newSprite) newSprite = playerSprites[0];
      this.setPlayerSprite(player, element, newSprite);
   },
   changePlayerSpriteLast(id, element) {
      let player = this.pendingPlayers.find((obj) => obj.id == id);
      let newSprite = playerSprites[playerSprites.indexOf(player.sprite) - 1];
      if (!newSprite) newSprite = playerSprites[playerSprites.length - 1];
      this.setPlayerSprite(player, element, newSprite);
   },
   setPlayerSprite(player, element, sprite) {
      player.sprite = sprite;
      Game.getComms().emitPlayerUpdated(player.id, player.sprite, player.pos);
      element.src = `/sprites/old/${player.sprite}${Math.random() > .5 ? "" : "-jump"}.png`;
   },

   removePlayer(player) {
      let oldPlayer = this.pendingPlayers.find((obj) => obj.id == player.id);
      let index = this.pendingPlayers.indexOf(oldPlayer);
      let removedPos = this.pendingPlayers[index].pos;
      if (oldPlayer.type == "touch") createdTouchPlayer = false;
      this.pendingPlayers.splice(index, 1);
      updatePlayersOnPregameDisplay();
      Game.getComms().emitPlayerRemoved(player.id);
      for (let i = this.pendingPlayers.length - 1; i > index; i--) {
         this.pendingPlayers[i].pos = this.pendingPlayers[i - 1].pos;
         Game.getComms().emitPlayerUpdated(this.pendingPlayers[i].id, this.pendingPlayers[i].sprite, this.pendingPlayers[i].pos);
      }
      if (this.pendingPlayers[index]) {
         this.pendingPlayers[index].pos = removedPos;
         Game.getComms().emitPlayerUpdated(this.pendingPlayers[index].id, this.pendingPlayers[index].sprite, this.pendingPlayers[index].pos);
      }
      this.playerIndex--;
   }
}