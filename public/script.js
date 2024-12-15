import { stats } from "./engine/cell.js";
import { Grid } from "./engine/grid.js";
import { Player } from "./engine/player.js";
import { SaveData, clearSave } from "./storage.js";
import { ImageCache } from "./engine/image-cache.js";
import { hideAlerts, showAlerts, createAlert } from "./alertSystem.js";

SaveData.firstTime = true;
if (SaveData.firstTime) {
    showAlerts()
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
    startGame()
}

const grid = new Grid(7, 7);

const layout = [
    1, 1, 1, 1, 1, 1, 1,
    1, 3, 0, 0, 0, 6, 1,
    1, 2, 0, 0, 0, 0, 1,
    1, 4, 0, 0, 0, 0, 1,
    1, 5, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 1,
    1, 1, 1, 1, 1, 1, 1,
];

grid.loadData(layout, [
    {
        pos: { x: 2, y: 4 },
        data: ["tomato"]
    }
]);
grid.setPlayerPos(3, 3);

const player = new Player();

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth / 4;
canvas.height = window.innerHeight / 4;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const csize = 32;

async function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const cell of grid.cells) {
        ctx.drawImage(await ImageCache.get(cell.proto.src), cell.x * csize, cell.y * csize, csize, csize);
        if (cell.item !== null && cell.item !== undefined) ctx.drawImage(await ImageCache.get((cell.item) + ".png"), cell.x * csize, cell.y * csize, csize, csize);
    }

    ctx.drawImage(await ImageCache.get(player.item === null ? "player.png" : "player-jumping.png"), grid.px * csize, grid.py * csize, csize, csize);
    if (player.item !== null) {
        ctx.drawImage(await ImageCache.get(player.item + ".png"), grid.px * csize, (grid.py - 1) * csize, csize, csize);
    }
}

const dirMap = {
    KeyW: [0, -1],
    KeyA: [-1, 0],
    KeyS: [0, 1],
    KeyD: [1, 0],
    ArrowUp: [0, -1],
    ArrowLeft: [-1, 0],
    ArrowDown: [0, 1],
    ArrowRight: [1, 0]
};

const listener = (e) => {
    const key = e.code;
    const val = dirMap[key];
    if (val !== undefined) {
        grid.movePlayer(val[0], val[1]);
    }
    else if (key === "KeyX") {
        console.log('i')
        grid.interact(player);
    }
    draw();
};

document.body.addEventListener("keydown", listener);

function startGame() {
    let timeLeft = 60;
    setInterval(() => {
        timeLeft--;
        document.querySelector(".timer").textContent = timeLeft + " seconds";
    }, 1000);
    setTimeout(endGame, 60000)
}

function endGame() {
    document.body.removeEventListener("keydown", listener);
    console.log("hi");
    showAlerts();
    createAlert(`Game over! Your score is ${stats.score}`);
    if (stats.score >= SaveData.highScore) {
        createAlert("New high score!");
    }
    createAlert("Closing this will reload the game.")
    SaveData.highScore = Math.max(SaveData.highScore, stats.score);
    hideAlerts(() => { location.reload() });
}

draw();