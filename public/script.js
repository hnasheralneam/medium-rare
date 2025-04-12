import { Game } from "./engine/game.js";
import { SaveData } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import { showAlerts, createAlert, hideAlerts } from "./alertSystem.js";
import { PlayerHandler } from "./engine/playerHandler.js";

await ImageCache.init();

window.addEventListener("resize", () => Game.display());

const levelName = window.levelName;
window.startGame = (levelName) => {
    Game.start(levelName);
}
if (!window.multiplayer) {
    Game.init(window.levelName);
}

window.attemptStartingGame = () => {
    if (window.multiplayer && !window.isLeader) return;
    if (PlayerHandler.getPlayerCount() >= Game.level.minPlayers && PlayerHandler.getPlayerCount() <= Game.level.maxPlayers) { // should be > than min for level and < than max for level
        document.querySelector(".pre-game").classList.add("hidden");
        document.removeEventListener("keypress", gameStartListener);
        window.startGame(levelName);
    }
    else {
        if (PlayerHandler.getPlayerCount() < Game.level.minPlayers)
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
            <h2>Level: ${window.levelName}</h2>
            <img src="/levels/${window.levelName}.png" height="230"><br><br>

            <p class="output"></p>
            ${(SaveData[window.levelName + "HighScore"] > 0 && !window.multiplayer) ? "<h1>Your high score: " + SaveData[window.levelName + "HighScore"] + "</h1>" : ""}
            ${
        window.multiplayer ? (window.isLeader ? `<button onclick="window.attemptStartingGame()">Play</button>` : `
                    <p>Are you ready yet?</p>
                `) : `
                    <p>Press arrow/wsad keys or move controller or touch screen to add player</p>
                    <button onclick="window.attemptStartingGame()">Play</button>
                `
            }
            <br>
            <div class="connected-players"></div>
        </div>
    `;
    document.addEventListener("keypress", gameStartListener);
}
function gameStartListener(e) {
    if (e.key == "Enter") {
        window.attemptStartingGame();
    }
}
window.createPreGamePanel = createPreGamePanel;

window.updatePlayersOnPregameDisplay = () => {
    const connectedPlayersElement = document.querySelector(".connected-players");
    if (connectedPlayersElement) connectedPlayersElement.innerHTML = "";
    else return;

    const pendingPlayers = PlayerHandler.pendingPlayers;
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
playPauseButton.addEventListener("click", () => {
    togglePause(false);
});
continueButton.addEventListener("click", () => {
    togglePause(false);
});

function togglePause(fromRemote) {
    if (Game.paused) {
        if ((window.multiplayer && fromRemote) || !window.multiplayer) {
            Game.resume();
            playPauseButton.querySelector("img").src = "/icons/pause.svg";
            settingsPanel.classList.add("hidden");
        }

        if (window.multiplayer && !fromRemote) {
            socket.emit("pause", {
                roomid: window.roomid,
                paused: false
            });
        }
    }
    else {
        if ((window.multiplayer && fromRemote) || !window.multiplayer) {
            Game.pause();
            playPauseButton.querySelector("img").src = "/icons/play.svg";
            settingsPanel.classList.remove("hidden");
        }

        if (window.multiplayer && !fromRemote) {
            socket.emit("pause", {
                roomid: window.roomid,
                paused: true
            });
        }
    }
}

window.togglePause = (fromRemote) => {
    togglePause(fromRemote);
};