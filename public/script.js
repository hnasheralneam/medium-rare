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
if (!window.multiplayer) {
    Game.init(window.levelName);
}

let pressListener;
window.attemptStartingGame = () => {
    if (Game.getPlayerCount() >= Game.level.minPlayers && Game.getPlayerCount() <= Game.level.maxPlayers) { // should be > than min for level and < than max for level
        document.querySelector(".pre-game").classList.add("hidden");
        clearInterval(pressListener);
        window.startGame(levelName);
    }
    else {
        if (Game.getPlayerCount() < Game.level.minPlayers)
            document.querySelector(".output").textContent = `Add at least ${Game.level.minPlayers} player${Game.level.minPlayers > 1 ? "s" : ""}`;
        else {
            document.querySelector(".output").textContent = `Have no more than ${Game.level.maxPlayers} player${Game.level.maxPlayers > 1 ? "s" : ""}`;
        }
    }
}

if (SaveData.firstTime && !window.multiplayer) {
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
else if (!window.multiplayer) {
    createPreGamePanel();
}

function createPreGamePanel() {
    const preGamePanel = document.querySelector(".pre-game");
    preGamePanel.classList.remove("hidden");
    preGamePanel.innerHTML = `
        <div>
            <h2>Level: ${levelName}</h2>
            <img src="/levels/${levelName}.png" height="230"><br><br>

            <p class="output"></p>
            ${(SaveData[levelName + "HighScore"] > 0) ? "<h1>Your high score: " + SaveData[levelName + "HighScore"] + "</h1>" : ""}
            <p>Press arrow/wsad keys or move controller to add player</p>
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
window.createPreGamePanel = createPreGamePanel;

window.updatePlayersOnPregameDisplay = () => {
    const connectedPlayersElement = document.querySelector(".connected-players");
    connectedPlayersElement.innerHTML = "";

    const allPlayers = [...Game.keyboardPlayerInputMaps, ...Game.gamepadPlayerIndexs];
    const pendingPlayers = Game.pendingPlayers;
    // fix style, keep side-by-side
    for (let i = 0; i < pendingPlayers.length; i++) {
        const player = pendingPlayers[i];
        const playerElement = document.createElement("div");
        playerElement.classList.add("pregame-player");
        playerElement.innerHTML = `
            <h2>Player ${i + 1}</h2>
            <p>(${player.type})</p>
            <img src="/sprites/${player.sprite}/${Math.random() > .5 ? "idle" : "jumping"}.png">
            <div class="controls-map"></div>
        `;
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