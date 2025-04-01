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
    // instead of all this, show a pre-game screen with your previous high score and start button
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

    // setTimeout(() => {
    //     Game.start();
    //     levelPicker.classList.add("hidden");
    // }, 400);

    for (const levelName in Game.levels) {
        let levelElement = document.createElement("div");
        levelElement.style.margin = "0 4rem";
        levelElement.classList.add("level-picker-element");
        levelElement.innerHTML = `
            <h3>${levelName}</h3>
            <p style="display: flex; align-items: center; justify-content: center">${getPeopleImages(Game.levels[levelName].minPlayers)}<span>&nbsp;-&nbsp;</span>${getPeopleImages(Game.levels[levelName].maxPlayers)}&nbsp;Players</p>
        `;
        function getPeopleImages(count) {
            let people = "";
            for (let i = 0; i < count; i++) {
                people += `<img src="sprites/player${Math.random() < .5 ? "2" : ""}/idle.png">`;
            }
            return people;
        }
        let level = Game.levels[levelName];
        let button = document.createElement("button");
        button.textContent = "Play";
        button.addEventListener("click", () => {
            Game.start(level);
            levelPicker.classList.add("hidden");
        });
        let imageParent = document.createElement("div");
        let image = document.createElement("img");
        image.src = `levels/${levelName}.png`;
        image.style.width = "100%";
        imageParent.style.display = "flex";
        imageParent.style.alignItems = "center";
        imageParent.style.justifyContent = "center";
        imageParent.style.margin = "1rem auto";
        imageParent.style.width = "15rem";
        imageParent.style.height = "15rem";
        imageParent.appendChild(image);
        levelElement.appendChild(button);
        levelElement.appendChild(document.createElement("br"));
        levelElement.appendChild(imageParent);
        levelPicker.appendChild(levelElement);
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