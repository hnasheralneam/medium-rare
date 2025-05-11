import { PlayerHandler } from "../engine/playerHandler.js";
import { socket, userInfo } from "../scripts/lobby.js";
import { Game } from "../state.js";
import { setLevelData } from "../levelDataParser.js";
import { rehydrateCell } from "./cellRehydrator.js";
import { DisplayController } from "./displayController.js";

// Add start button for leader
async function leaderInit() {
   let levelName = document.querySelector(".level-select-dropdown").value;
   window.isLeader = true;
   window.levelName = levelName;
   Game.getComms().emitInit();
}
if (userInfo.usertype == "leader") {
   document.querySelector(".leader-options").classList.remove("hidden");
}

document.querySelector(".start-game-button").addEventListener("click", leaderInit);


// actual game stuff
socket.on("gameInitialized", ({ levelName, levelData }) => {
   window.levelName = levelName;
   setLevelData(levelData);
   Game.init(levelData); // Game.init should be called before DisplayController.createPreGamePanel if it relies on levelData through PlayerHandler
   DisplayController.createPreGamePanel();
   document.querySelector(".multiplayer-lobby").remove();
});

socket.on("gameStarted", () => {
   Game.getComms().onStart();
})

socket.on("gameEnded", (stats) => {
   Game.getComms().onGameEnd(stats);
});

socket.on("createPlayer", ({ player }) => {
   Game.getComms().emitCreatePlayer(player);
});

socket.on("updateTime", ({ timeLeft }) => {
   Game.getComms().onUpdateTime(timeLeft);
});

socket.on("requestRedraw", () => {
   Game.getComms().onRedrawGrid();
});

socket.on("updatePlayer", (player) => {
   Game.updatePlayer(false, player);
});

socket.on("setCell", ({ index, cell }) => {
   Game.getComms().onCellChanged(index, rehydrateCell(cell));
});

socket.on("resume", () => {
   Game.getComms().onResume();
});
socket.on("pause", () => {
   Game.getComms().onPause();
});

socket.on("createOrder", (data) => {
   Game.getComms().onCreateOrder(data);
});
socket.on("filledOrder", (number) => {
   Game.getComms().onFilledOrder(number);
});

socket.on("increaseScore", (score) => {
   Game.getComms().onIncreaseScore(score);
});





socket.on("gameStarted", async () => {
   if (window.isLeader) return;
   document.querySelector(".pre-game").classList.add("hidden");
   Game.getComms().emitStartGame();
});

socket.on("playerAdded", (player) => {
   PlayerHandler.addRemotePlayer(player);
});
socket.on("playerUpdated", ({ id, sprite, pos }) => {
   PlayerHandler.updateRemotePlayer(id, sprite, pos);
});
socket.on("playerRemoved", (id) => {
   let player = PlayerHandler.pendingPlayers.find((player) => player.id == id);
   if (player) PlayerHandler.removePlayer(player);
});