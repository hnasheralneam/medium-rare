import { Cell } from "./engine/cell.js";
import { Grid } from "./engine/grid.js";
import { Player } from "./engine/player.js";
import { Game } from "./engine/game.js";
import { SaveData, clearSave } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import * as G from "./engine/graphics.js";

await ImageCache.init();

window.addEventListener("resize", () => Game.display());

// this line is for testing
SaveData.firstTime = false;
if (SaveData.firstTime) {
    showAlerts();
    createAlert("POV: You are Phil", undefined, true);
    createAlert("And the customers are angry", undefined, true);
    createAlert("The only way to save your beloved restaurant from angry customers is to make as many salads in one minute", undefined, true);
    createAlert("Pick up raw materials from the crate", undefined, true);
    createAlert("Slice them and combine to make salad", undefined, true);
    createAlert("Button for interacting is in settings", undefined, true);
    createAlert("Good luck!", undefined, true);
    hideAlerts(showLevelPicker);
    SaveData.firstTime = false;
}
else {
    showLevelPicker();
}

function showLevelPicker() {
    let levelPicker = document.querySelector(".level-picker");
    levelPicker.classList.remove("hidden");

    setTimeout(() => {
        Game.start();
        levelPicker.classList.add("hidden");
    }, 10);
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