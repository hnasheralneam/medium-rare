import * as G from "./graphics.js";
import { Grid } from "./grid.js";
import { Player } from "./player.js";
import { ImageCache } from "./image-cache.js";
import { OrderHandler } from "./orderHandler.js";
import { SaveData, clearSave } from "../storage.js";
import { hideAlerts, showAlerts, createAlert } from "../alertSystem.js";

// player start positions should be defined in here as well
// amount of orders should be defined here as well
const levels = {
    // showcase image is the name of the level
    huge: {
        layout: [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 4, 0, 0, 0, 6, 1,
            1, 3, 0, 4, 0, 4, 0, 4, 4, 4, 1,
            1, 4, 4, 4, 0, 4, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1,
            1, 0, 4, 4, 4, 0, 4, 0, 0, 0, 1,
            1, 0, 0, 0, 4, 0, 4, 0, 4, 0, 1,
            1, 0, 0, 5, 4, 0, 0, 0, 4, 2, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
        ],
        width: 11,
        height: 9,
        minPlayers: 2,
        maxPlayers: 4,
        menuOptions: ["salad"],
        timeSeconds: 100
    },

    wide: {
        layout: [
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 4, 0, 0, 4, 0, 0, 6, 1,
            1, 4, 0, 0, 4, 0, 0, 0, 1,
            1, 4, 0, 0, 4, 0, 0, 4, 1,
            1, 5, 0, 0, 4, 0, 0, 3, 1,
            1, 0, 0, 0, 4, 0, 0, 2, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1
        ],
        width: 9,
        height: 7,
        minPlayers: 2,
        maxPlayers: 4,
        menuOptions: ["salad"],
        timeSeconds: 80
    },

    square: {
        layout: [
            1, 1, 1, 1, 1, 1, 1,
            1, 3, 0, 0, 0, 6, 1,
            1, 2, 0, 0, 0, 0, 1,
            1, 4, 0, 0, 0, 0, 1,
            1, 5, 0, 0, 0, 0, 1,
            1, 5, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1,
        ],
        width: 7,
        height: 7,
        minPlayers: 1,
        maxPlayers: 2,
        menuOptions: ["salad"],
        timeSeconds: 60
    }
}


export const Game = {
    /** @type { Player[] } */
    players: [],
    /** @type { Grid } */
    grid: null,
    keydownHandle: null,
    paused: false,
    stats: {
        score: 0
    },
    levels: levels,
    busy: false,

    start(levelName) {
        const player1 = new Player({
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            Period: "interact"
        }, 5, 3, "player");
        const player2 = new Player({
            KeyW: "up",
            KeyA: "left",
            KeyS: "down",
            KeyD: "right",
            KeyX: "interact",
            KeyQ: "interact",
            KeyE: "interact"
        }, 3, 3, "player2");

        this.players.push(player1);
        this.players.push(player2);

        // this.level = level;
        this.level = levels[levelName];
        this.grid = new Grid(this.level.width, this.level.height);
        this.grid.loadData(this.level.layout);
        for (const player of this.players) {
            this.grid.addPlayer(player);
        }

        this.orderHandler = new OrderHandler(this.level.menuOptions);

        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                player.keyPressed(e, this.grid);
                if (player.anim === 1) this.notifyRedraw();
            }

            // this will be called only when the listener is set
            this.display();
        };

        // this listener needs to be cleared when the game is finished
        document.body.addEventListener("keydown", this.keydownHandle);


        this.display();
        this.startTimer();

        this.initControlsDisplay();
    },

    end() {
        document.body.removeEventListener("keydown", this.keydownHandle);
        clearInterval(this.timer);


        const postGamePanel = document.querySelector(".post-game");
        postGamePanel.classList.remove("hidden");
        postGamePanel.innerHTML = `
        <div>
            <h2>Game Complete!</h2>
            <h1>Your score:  ${Game.stats.score}</h1>
            <span>${Game.stats.score >= SaveData.highScore ? "New high score!" : ""}</span>
            <p>Completed ${this.orderHandler.completedOrders.length} orders, failed ${this.orderHandler.failedOrders.length} orders</p>
            <button onclick="location.reload()">Play again</button>
        </div>
        `;
    },

    startTimer() {
        let timeLeft = this.level.timeSeconds;
        document.querySelector(".timer").textContent = timeLeft + " seconds | 0 Points";
        this.timer = setInterval(() => {
            if (this.paused) return;
            if (timeLeft <= 0) {
                this.end();
                return;
            }
            timeLeft--;
            document.querySelector(".timer").textContent = timeLeft + " seconds | " + this.stats.score + " Points";
        }, 1000);
    },

    resume() {
        this.paused = false;
    },

    pause() {
        this.paused = true;
    },

    initControlsDisplay() {
        let controlsElement = document.querySelector(".controls");
        let index = 0;
        for (let player of this.players) {
            index++;
            let playerElement = document.createElement("div");
            playerElement.classList.add("player-controls-parent");
            playerElement.innerHTML = `
                <div>
                    <h2>Player ${index}</h2>
                    <img src="sprites/${player.sprite}/idle.png">
                </div>
                <div class="controls-map"></div>
                <br>
            `;
            let controlsMapElement = playerElement.querySelector(".controls-map");
            for (let key in player.inputMap) {
                let controlElement = document.createElement("div");
                controlElement.classList.add("control");
                controlElement.innerHTML = `
                    <span>${player.inputMap[key]} - </span>
                    <span>${key}</span>
                `;
                controlsMapElement.appendChild(controlElement);
            }
            controlsElement.appendChild(playerElement);
        }
    },

    display() {
        const csize = 32;
        const offset = {
            x: this.grid.width / 2 * csize,
            y: this.grid.height / 2 * csize
        };
        G.pushModifier(-offset.x, -offset.y);

        G.clear("#000");
        for (const cell of this.grid.cells) {
            G.drawImage(
                ImageCache.getTile(cell.proto.sourceImage),
                cell.x * csize,
                cell.y * csize
            );
            if (cell.item !== null && cell.item !== undefined) {
                G.drawImage(
                    ImageCache.getItem(cell.item.src()),
                    cell.x * csize,
                    cell.y * csize
                );
            }
        }
        for (const player of this.players) {
            const pos = player.smoothPos();
            G.drawImage(
                ImageCache.getSprite(player.sprite, player.item === null ? "idle" : "jumping"),
                pos[0] * csize,
                pos[1] * csize
            );
            if (player.item !== null) {
                G.drawImage(
                    ImageCache.getItem(player.item.src()),
                    pos[0] * csize,
                    (pos[1] - 1) * csize
                );
            }
        }
        G.restore();
    },

    notifyRedraw() {
        if (this.busy) return;
        this.busy = true;
        window.requestAnimationFrame(() => this.loop());
    },

    loop() {
        if (!this.busy) return;
        this.busy = false;
        for (const player of this.players) {
            if (player.tickAnim()) this.busy = true;
        }
        this.display();
        window.requestAnimationFrame(() => this.loop());
    }
};


/*

Level Storage:
Text file (or string)

?<VERSION>
w[WIDTH]
h[HEIGHT]
#0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;

*/
