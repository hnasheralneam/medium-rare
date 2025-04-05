import * as G from "./graphics.js";
import { Grid } from "./grid.js";
import { Player, InputPlayer, GamepadPlayer } from "./player.js";
import { ImageCache } from "./image-cache.js";
import { OrderHandler } from "./orderHandler.js";
import { SaveData, clearSave } from "../storage.js";

let inputMaps = [
    {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        Period: "interact"
    },
    {
        KeyW: "up",
        KeyA: "left",
        KeyS: "down",
        KeyD: "right",
        KeyX: "interact",
        KeyQ: "interact",
        KeyE: "interact"
    }
];
let playerSprites = ["player", "player2"]
let numberOfPlayers = 2;

window.addEventListener("gamepadconnected", (e) => {
    Game.addGamepadPlayer(e.gamepad.index);
});


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
    busy: false,
    levelNames: ["square", "wide", "huge"],
    gamepadPlayerIndexs: [],

    addGamepadPlayer(index) {
        this.gamepadPlayerIndexs.push(index);
    },

    async start(levelName) {
        console.log("Started game");
        this.init();

        this.level = await this.getLevelData(levelName);
        this.grid = new Grid(this.level.width, this.level.height);
        this.grid.loadData(this.level.layout);

        for (let i = 0; i < this.gamepadPlayerIndexs.length; i++) {
            let index = this.gamepadPlayerIndexs[i];
            let player = new GamepadPlayer(
                index,
                this.level.playerPositions[index][0],
                this.level.playerPositions[index][1],
                "player"
            );
            this.players.push(player);
            this.grid.addPlayer(player);

            setInterval(() => {
                player.handleGamepad(this.grid);
            }, 170);
        }

        for (let i = 0; i < numberOfPlayers; i++) {
            let player = new InputPlayer(
                inputMaps[i],
                this.level.playerPositions[i + this.gamepadPlayerIndexs.length][0],
                this.level.playerPositions[i + this.gamepadPlayerIndexs.length][1],
                playerSprites[i]
            );
            this.players.push(player);
            this.grid.addPlayer(player);
        }

        this.orderHandler = new OrderHandler(this.level.menuOptions);

        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                if (player.constructor.name === "InputPlayer") {
                    player.keyPressed(e, this.grid);
                    if (player.anim === 1) this.notifyRedraw();
                }
            }

            // this will be called only when the listener is set
            this.display();
        };
        document.body.addEventListener("keydown", this.keydownHandle);

        this.display();
        this.startTimer();
    },

    init() {
        this.initControlsDisplay();
    },

    async getLevelData(levelName) {
        const url = `/resources/levels/${levelName}.json`;
        return await fetch(url)
            .then(x => x.text())
            .then(y => {
                return JSON.parse(y);
            });
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
                    <img src="/sprites/${player.sprite}/idle.png">
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
            // if (player.constructor.name === "GamepadPlayer") {
            //     player.handleGamepad(this.grid);
            // }
        }
        this.display();
        window.requestAnimationFrame(() => this.loop());
    }
};