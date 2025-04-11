// this is only for pre-game players!
import { Game } from "./game.js";

// these are only available before the game starts
window.addEventListener("gamepadconnected", (e) => {
   PlayerHandler.addGamepadPlayer(e.gamepad.index);
}
);
document.body.addEventListener("keydown", keyboardPlayerConnectionListener);
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
document.body.addEventListener("touchstart", () => {
   let touchPad = document.createElement("div");
   touchPad.classList.add("touchpad");
   touchPad.innerHTML = `

    `;
   // then insert the html elemnt
   // the id for the touchpad player can be generated here and inserted into the function calls for this (handleTouchInput(id, action)), where they will be routed to the correct player
});

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
let playerSprites = ["player", "player2", "player3", "player4"];


export const PlayerHandler = {
   pendingPlayers: [],
   gamepadPlayerIndexs: [],
   keyboardPlayerInputMaps: [],
   playerIndex: 0,

   // for pre-game players specifically
   getPlayerCount() {
      return this.gamepadPlayerIndexs.length + this.keyboardPlayerInputMaps.length;
      // should also count remote players
   },
   getNextPos() {
      let pos = Game.level.playerPositions[this.playerIndex] || Game.level.playerPositions[0];
      this.playerIndex++;
      return pos;
   },

   gameStarted() {
      // should lock everything after this
      document.body.removeEventListener("keydown", keyboardPlayerConnectionListener);
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
      this.gamepadPlayerIndexs.push(index);
      window.updatePlayersOnPregameDisplay();

      if (window.multiplayer) {
         window.socket.emit("addPlayer", {
            roomid: window.roomid,
            id: id,
            sprite: pendingPlayer.sprite,
            startPos: pendingPlayer.pos
         });
      }
   },

   addKeyboardPlayer(inputMapIndex) {
      let id = window.crypto.randomUUID();
      let inputMap = inputMaps[inputMapIndex];
      if (!this.keyboardPlayerInputMaps.includes(inputMap)) {
         let pendingPlayer = {
            type: "keyboard",
            sprite: getRandomSprite(),
            inputMap: inputMap,
            id: id,
            mapIndex: inputMapIndex,
            pos: this.getNextPos()
         };
         this.pendingPlayers.push(pendingPlayer);
         this.keyboardPlayerInputMaps.push(inputMap);
         window.updatePlayersOnPregameDisplay();

         if (window.multiplayer) {
            window.socket.emit("addPlayer", {
               roomid: window.roomid,
               id: id,
               sprite: pendingPlayer.sprite,
               startPos: pendingPlayer.pos
            });
         }
      }
   }

}