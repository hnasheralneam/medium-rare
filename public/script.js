import { stats } from "./engine/cell.js";
import { Grid } from "./engine/grid.js";
import { Player } from "./engine/player.js";

alert("POV: You are Phil");
alert("And the customers are angry");
alert("The only way to save your beloved restaurant from angry customers is to make as many salads in one minute");
alert("Pick up raw materials from the crate");
alert("Slice them and combine to make salad");
alert("Press X to interact with everything");
alert("Good luck!");

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
const imageCache = {
    data: {},
    get: async function(name) {
        if (this.data[name] === null) return this.get("placeholder.png");
        if (this.data[name] === undefined) {
            try {
                const blob = await (await fetch(name)).blob();
                this.data[name] = await window.createImageBitmap(blob);
            }
            catch (e) {
                this.data[name] = null;
                return this.get("placeholder.png");
            }
        }
        return this.data[name];
    }
};

async function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const cell of grid.cells) {
        ctx.drawImage(await imageCache.get(cell.proto.src), cell.x * csize, cell.y * csize, csize, csize);
        if (cell.item !== null && cell.item !== undefined) ctx.drawImage(await imageCache.get((cell.item) + ".png"), cell.x * csize, cell.y * csize, csize, csize);
    }

    ctx.drawImage(await imageCache.get(player.item === null ? "player.png" : "player-jumping.png"), grid.px * csize, grid.py * csize, csize, csize);
    if (player.item !== null) {
        ctx.drawImage(await imageCache.get(player.item + ".png"), grid.px * csize, (grid.py - 1) * csize, csize, csize);
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

setTimeout(() => {
    document.body.removeEventListener("keydown", listener);
    alert(`Game over! Your score is ${stats.score}`);
}, 60000);

draw();