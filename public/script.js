import { Game } from "./engine/game.js";
import { SaveData, clearSave } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import { showAlerts, createAlert, hideAlerts } from "./alertSystem.js";

await ImageCache.init();

window.addEventListener("resize", () => Game.display());

const levelName = window.levelName;
window.startGame = (levelName) => {
    Game.start(levelName);
}

let pressListener;
window.attemptStartingGame = () => {
    if (Game.getPlayerCount() > 0) { // should be > than min for level and < than max for level
        document.querySelector(".pre-game").classList.add("hidden");
        clearInterval(pressListener);
        window.startGame(levelName);
    }
    else {
        document.querySelector(".output").textContent = "Add at least one player";
    }
}

if (SaveData.firstTime) {
    showAlerts();
    createAlert("POV: You are Phil", undefined, true);
    createAlert("And the customers are angry", undefined, true);
    createAlert("The only way to save your beloved restaurant from angry customers is to make as many salads as possible within the time", undefined, true);
    createAlert("Pick up raw materials from the crate", undefined, true);
    createAlert("Slice them and combine to make salad", undefined, true);
    createAlert("Player controls are in the settings (pause menu)", undefined, true);
    createAlert("Good luck!", undefined, true);
    hideAlerts(createPreGamePanel);
    SaveData.firstTime = false;
}
else {
    createPreGamePanel();
}

function createPreGamePanel() {
    const preGamePanel = document.querySelector(".pre-game");
    preGamePanel.classList.remove("hidden");
    preGamePanel.innerHTML = `
        <div>
            <h2>Level: ${levelName}</h2>
            <p class="output"></p>
            ${(SaveData.highScore > 0) ? "<h1>Your high score: " + SaveData.highScore + "</h1>" : ""}
            <p>Press arrow/wsad keys to choose controls for player</p>
            <button onclick="window.attemptStartingGame()">Play</button>
            <br>
            <div class="connected-players"></div>
        </div>
    `;
    pressListener = document.addEventListener("keypress", (e) => {
        if (e.key == "Enter") {
            window.attemptStartingGame();
        }
    });
}

window.updatePlayersOnPregameDisplay = () => {
    const connectedPlayersElement = document.querySelector(".connected-players");
    connectedPlayersElement.innerHTML = "";

    const allPlayers = [...Game.keyboardPlayerInputMaps, ...Game.gamepadPlayerIndexs];
    // fix style, keep side-by-side
    for (let i = 0; i < allPlayers.length; i++) {
        const player = allPlayers[i];
        const playerElement = document.createElement("div");
        playerElement.classList.add("pregame-player");
        playerElement.innerHTML = `
            <h2>Player ${i + 1}</h2>
            <p>(${typeof player == "number" ? "Gamepad" : "Keyboard"})</p>
            <img src="/sprites/player${Math.random() > .5 ? "2" : ""}/${Math.random() > .5 ? "idle" : "jumping"}.png">
            <div class="controls-map"></div>
        `;
        const controlsMapElement = playerElement.querySelector(".controls-map");
        for (let key in player.inputMap) {
            const controlElement = document.createElement("div");
            controlElement.classList.add("control");
            controlElement.innerHTML = `
                <span>${player.inputMap[key]} - </span>
                <span>${key}</span>
            `;
            controlsMapElement.appendChild(controlElement);
        }
        connectedPlayersElement.appendChild(playerElement);
    }
}


let settingsPanel = document.querySelector(".settings");
let playPauseButton = document.querySelector(".play-pause");
let continueButton = document.querySelector(".continue");
playPauseButton.addEventListener("click", togglePause);
continueButton.addEventListener("click", togglePause);

function togglePause() {
    if (Game.paused) {
        Game.resume();
        playPauseButton.textContent = "Pause";
        settingsPanel.classList.add("hidden");
    }
    else {
        Game.pause();
        playPauseButton.textContent = "Play";
        settingsPanel.classList.remove("hidden");
    }
}