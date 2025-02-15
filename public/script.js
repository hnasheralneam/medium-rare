import { stats } from "./engine/cell.js";
import { Grid } from "./engine/grid.js";
import { Player } from "./engine/player.js";
import { Level } from "./engine/level.js";
import { SaveData, clearSave } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import { hideAlerts, showAlerts, createAlert } from "./alertSystem.js";
import * as G from "./engine/graphics.js";

// debugging code
SaveData.firstTime = true;
if (SaveData.firstTime) {
    showAlerts();
    createAlert("POV: You are Phil", undefined, true);
    createAlert("And the customers are angry", undefined, true);
    createAlert("The only way to save your beloved restaurant from angry customers is to make as many salads in one minute", undefined, true);
    createAlert("Pick up raw materials from the crate", undefined, true);
    createAlert("Slice them and combine to make salad", undefined, true);
    createAlert("Press X to interact with everything", undefined, true);
    createAlert("Good luck!", undefined, true);
    hideAlerts(startGame);
    SaveData.firstTime = false;
}
else {
    // commented for debugging
    //startGame()
}

await ImageCache.init();


// add pause later
function startGame() {
    Level.start();
    Level.display();

    let timeLeft = 60;
    setInterval(() => {
        timeLeft--;
        document.querySelector(".timer").textContent = timeLeft + " seconds";
    }, 1000);
    setTimeout(endGame, 60000)

    Level.display();
    window.addEventListener("resize", () => Level.display());
}

function endGame() {
    Level.endGame();

    showAlerts();
    createAlert(`Game over! Your score is ${stats.score}`);
    if (stats.score >= SaveData.highScore) {
        createAlert("New high score!");
    }
    createAlert("Closing this will reload the game.")
    SaveData.highScore = Math.max(SaveData.highScore, stats.score);
    hideAlerts(() => { location.reload() });
}