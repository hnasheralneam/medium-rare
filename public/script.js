import { SaveData } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import { PlayerHandler } from "./engine/playerHandler.js";
import { DisplayController } from "./engine/displayController.js";
import { levelData } from "./levelDataParser.js";
import { Game } from "./state.js";

await ImageCache.init();
window.addEventListener("resize", () => Game.display());
const levelName = window.levelName;








export function attemptStartingGame() {
    if (window.multiplayer && !window.isLeader) return;
    let playerCount = PlayerHandler.getPlayerCount();
    if (playerCount >= levelData.minPlayers && playerCount <= levelData.maxPlayers) {
        DisplayController.hidePregamePanel();
        document.removeEventListener("keypress", gameStartListener);
        Game.getComms().emitStartGame(levelName);
    }
    else {
        if (PlayerHandler.getPlayerCount() < levelData.minPlayers)
            DisplayController.setPregameMessage(`Add at least ${levelData.minPlayers} player${levelData.minPlayers > 1 ? "s" : ""}`);
        else
            DisplayController.setPregameMessage(`Have no more than ${levelData.maxPlayers} player${levelData.maxPlayers > 1 ? "s" : ""}`);
    }
}

export function gameStartListener(e) {
    if (e.key == "Enter") attemptStartingGame();
}

export function updatePlayersOnPregameDisplay() {
    DisplayController.clearPregamePlayersElement();

    const pendingPlayers = PlayerHandler.pendingPlayers;
    for (let i = 0; i < pendingPlayers.length; i++) {
        const player = pendingPlayers[i];
        DisplayController.addPregamePlayerElement(player, i);
    }
}




// Play/pause
let settingsPanel = document.querySelector(".settings");
let playPauseButton = document.querySelector(".play-pause");
let continueButton = document.querySelector(".continue");
playPauseButton.addEventListener("click", () => {
    if (isPaused()) Game.getComms().emitResume(false);
    else Game.getComms().emitPause(false);
});
continueButton.addEventListener("click", () => {
    if (isPaused()) Game.getComms().emitResume(false);
    else Game.getComms().emitPause(false);
});


function isPaused() {
    return !settingsPanel.classList.contains("hidden");
}

export function pause() {
    playPauseButton.querySelector("img").src = "/icons/play.svg";
    settingsPanel.classList.remove("hidden");
}

export function resume() {
    playPauseButton.querySelector("img").src = "/icons/pause.svg";
    settingsPanel.classList.add("hidden");
}