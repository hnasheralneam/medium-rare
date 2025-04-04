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

if (SaveData.firstTime) {
    showAlerts();
    createAlert("POV: You are Phil", undefined, true);
    createAlert("And the customers are angry", undefined, true);
    createAlert("The only way to save your beloved restaurant from angry customers is to make as many salads as possible within the time", undefined, true);
    createAlert("Pick up raw materials from the crate", undefined, true);
    createAlert("Slice them and combine to make salad", undefined, true);
    createAlert("Button for interacting is in settings", undefined, true);
    createAlert("Good luck!", undefined, true);
    hideAlerts(startWide);
    SaveData.firstTime = false;
}
else {
    createPreGamePanel();
}

function createPreGamePanel() {
    const preGamePanel = document.querySelector(".pre-game");
    let pressListener;
    preGamePanel.classList.remove("hidden");
    preGamePanel.innerHTML = `
        <div>
            <h2>Level: ${levelName}</h2>
            <h1>Your high score: ${SaveData.highScore}</h1>
            <button onclick="${preGamePanel.classList.remove('hidden')}; clearInterval(${pressListener}); window.startGame(${levelName})">Play</button>
        </div>
    `;
    pressListener = document.addEventListener("keypress", (e) => {
        if (e.key == "Enter") {
            document.querySelector(".pre-game").classList.add("hidden");
            clearInterval(pressListener);
            window.startGame(levelName);
        }
    });
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