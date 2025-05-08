import { PlayerHandler } from "./playerHandler.js";

export const DisplayController = {
   hidePregamePanel() {
      document.querySelector(".pre-game").classList.add("hidden");
   },
   showPregamePanel() {
      document.querySelector(".pre-game").classList.remove("hidden");
   },
   setPregameMessage(message) {
      document.querySelector(".output").textContent = message;
   },

   clearPregamePlayersElement() {
      const connectedPlayersElement = document.querySelector(".connected-players");
      if (connectedPlayersElement) connectedPlayersElement.innerHTML = "";
   },
   addPregamePlayerElement(player, i) {
      const connectedPlayersElement = document.querySelector(".connected-players");
      const playerElement = document.createElement("div");
      playerElement.classList.add("pregame-player");
      playerElement.innerHTML = `
         <button class="remove"><img src="../icons/close.svg" alt="close"></button>
         <h2>Player ${i + 1}</h2>
         <p>(${player.type})</p>
         <img src="/sprites/old/${player.sprite}${Math.random() > .5 ? "" : "-jump"}.png">
         <div class="controls-map"></div>
      `;
      playerElement.querySelector(".remove").addEventListener("click", () => {
         PlayerHandler.removePlayer(player);
      });
      if (player.type == "keyboard") {
         const controlsMapElement = playerElement.querySelector(".controls-map");
         let title = document.createElement("h3");
         title.textContent = "Controls";
         controlsMapElement.appendChild(title);
         for (let key in player.inputMap) {
               const controlElement = document.createElement("div");
               controlElement.classList.add("control");
               controlElement.innerHTML = `
               <span>${player.inputMap[key]} - </span>
               <span>${key}</span>
         `;
               controlsMapElement.appendChild(controlElement);
         }
         playerElement.append(controlsMapElement);
      }
      connectedPlayersElement.appendChild(playerElement);
   },

   createPlayerControlsElements(players) {
      let controlsElement = document.querySelector(".controls");
      let index = 0;
      for (let player of players) {
         index++;
         let playerElement = document.createElement("div");
         playerElement.classList.add("player-controls-parent");
         playerElement.innerHTML = `
               <div>
                  <h2>Player ${index}</h2>
                  <img src="/sprites/old/${player.sprite}.png">
               </div>
               <div class="controls-map"></div>
               <br>
         `;
         let controlsMapElement = playerElement.querySelector(".controls-map");
         for (let key in player.inputMap) {
               let controlElement = document.createElement("div");
               controlElement.classList.add("control");
               controlElement.innerHTML = `
                  <span>${player.inputMap[key]} - </span>
                  <span>${key}</span>
               `;
               controlsMapElement.appendChild(controlElement);
         }
         controlsElement.appendChild(playerElement);
      }
   },
   addOrderElement(element) {
      document.querySelector(".orders").appendChild(element);
   },
   updateTime(timeSeconds) {
      document.querySelector(".time").textContent = timeSeconds + " seconds";
   },
   updatePoints(points) {
      document.querySelector(".points").textContent = points + ` Point${points > 1 ? "s" : ""}`;
   },
   addTouchpad(touchpad) {
   document.querySelector(".touchpad-container").append(touchpad);
   }
}