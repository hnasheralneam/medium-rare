import * as G from "./graphics.js";
import { Grid, RemoteGrid } from "./grid.js";
import { KeyboardPlayer, GamepadPlayer, TouchPlayer, RemotePlayer } from "./player.js";
import { ImageCache } from "./image-cache.js";
import { OrderHandler } from "./orderHandler.js";
import { SaveData } from "../storage.js";
import { PlayerHandler } from "./playerHandler.js";

window.levelNames = ["square", "wide", "huge"];

export const Game = {
    players: [],
    grid: null,
    keydownHandle: null, // checked if null as a hacky "has game started" check
    paused: false,
    stats: {
        score: 0
    },
    busy: false,
    initialized: false,

    async init() {
        this.level = await this.getLevelData(window.levelName);
        this.grid = window.multiplayer ? new RemoteGrid(this.level.width,this.level.height) : new Grid(this.level.width,this.level.height);
        this.grid.loadData(this.level.layout, this.level.extra);
        this.initialized = true;
        return;
    },

    async start(levelName) {
        if (!this.initialized) {
            await this.init(levelName);
        }
        console.info("Started game");

        // stop accepting new players
        PlayerHandler.gameStarted();
        // players
        for (const pendingPlayer of PlayerHandler.pendingPlayers) {
            this.addPlayer(pendingPlayer);
        }
        this.startHandlingKeyboardInput();


        this.orderHandler = new OrderHandler(this.level.menuOptions);

        this.initControlsDisplay();
        this.display();
        this.startTimer();

        if (window.multiplayer && window.isLeader) {
            window.socket.emit("startGame", {
                roomid: window.roomid,
                message: window.levelName,
                time: Date.now()
            });
        }
    },

    startHandlingKeyboardInput() {
        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                if (player.constructor.name === "KeyboardPlayer") {
                    player.keyPressed(e, this.grid);
                    if (player.anim === 1)
                        this.notifyRedraw();
                }
            }
        }
            ;
        document.body.addEventListener("keydown", this.keydownHandle);
    },

    addPlayer(pendingPlayer) {
        let player;
        if (pendingPlayer.type == "gamepad") {
            let index = pendingPlayer.index;
            player = new GamepadPlayer(index, pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
            this.players.push(player);

            setInterval( () => {
                player.handleGamepad(this.grid);
            }
            , 50);
        } else if (pendingPlayer.type == "keyboard") {
            player = new KeyboardPlayer(pendingPlayer.inputMap, pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        } else if (pendingPlayer.type == "touch") {
            player = new TouchPlayer(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        } else if (pendingPlayer.type == "remote") {
            player = new RemotePlayer(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        }
        if (player) {
            this.players.push(player);
        }
    },

    async getLevelData(levelName) {
        const url = `/resources/levels/${levelName}.json`;
        return await fetch(url).then(x => x.text()).then(y => {
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
            <span>${Game.stats.score >= SaveData[window.levelName + "HighScore"] ? "New high score!" : ""}</span>
            <p>Completed ${this.orderHandler.completedOrders.length} orders, failed ${this.orderHandler.failedOrders.length} orders</p>
            ${window.multiplayer ? '' : '<button onclick="location.reload()">Play again</button>'}
            <button onclick="window.location = window.location.origin">Home</button>
        </div>
        `;
        if (Game.stats.score >= SaveData[window.levelName + "HighScore"]) {
            SaveData[window.levelName + "HighScore"] = Game.stats.score;
        }
        document.addEventListener("keypress", (e) => {
            if (e.key == "Enter") {
                // going home always?
                if (!window.multiplayer) location.reload();
                else window.location = window.location.origin;
            }
        });
        let replayWithGamepad = setInterval(() => {
            let gamepads = navigator.getGamepads();
            gamepads.forEach((gamepad) => {
                if (gamepad && gamepad.buttons[1].pressed) {
                    clearInterval(replayWithGamepad);
                    if (!window.multiplayer) location.reload();
                    else window.location = window.location.origin;
                }
            });
        }, 30);
    },

    startTimer() {
        let timeLeft = this.level.timeSeconds;
        document.querySelector(".timer").textContent = timeLeft + " seconds | 0 Points";
        this.timer = setInterval( () => {
            if (this.paused)
                return;
            timeLeft--;
            if (timeLeft <= 0) {
                this.end();
                return;
            }
            document.querySelector(".timer").textContent = timeLeft + " seconds | " + this.stats.score + " Points";
        }
        , 1000);
    },

    resume() {
        this.paused = false;
    },

    pause() {
        this.paused = true;
    },

    display() {
        const csize = 32;
        const offset = {
            x: this.grid.width / 2 * csize,
            y: this.grid.height / 2 * csize
        };
        G.pushModifier(-offset.x, -offset.y);

        G.clear("#000");
        // draw cells
        for (const cell of this.grid.cells) {
            G.drawImage(ImageCache.getTile("floor.png"), cell.x * csize, cell.y * csize);
            G.drawImage(ImageCache.getTile(cell.proto.sourceImage), cell.x * csize, cell.y * csize);
        }
        // draw players
        for (const player of this.players) {
            const pos = player.smoothPos();
            if (player.flipped)
                G.drawMirroredPlayer(ImageCache.getPlayer(player.sprite), pos[0] * csize, pos[1] * csize, player.item === null ? 0 : 1, 0);
            else
                G.drawPlayer(ImageCache.getPlayer(player.sprite), pos[0] * csize, pos[1] * csize, player.item === null ? 0 : 1, 0);

            if (player.item !== null) {
                G.drawImage(ImageCache.getItem(player.item.src()), pos[0] * csize, (pos[1] - 1) * csize);
                if (player.item.isContainer()) {
                    player.item.getItems().forEach((item) => {
                        G.drawImage(ImageCache.getItem(item.src()), pos[0] * csize, (pos[1] - 1) * csize);
                    });
                }
            }
        }
        // draw items on cells
        for (const cell of this.grid.cells) {
            if (cell.data) {
                if (cell.data.item) {
                    G.drawImage(ImageCache.getItem(cell.data.item.src()), cell.x * csize, cell.y * csize);
                    if (cell.data.item.isContainer()) {
                        cell.data.item.getItems().forEach((item) => {
                            G.drawImage(ImageCache.getItem(item.src()), cell.x * csize, cell.y * csize);
                        });
                    }

                    if (cell.data.active) {
                        let total = cell.data.timeNeededMs;
                        let part = cell.data.timeLeft;
                        G.drawProgressBar(part, total, cell.x * csize, cell.y * csize);
                    }
                }

                if (cell.data.items) {
                    G.drawImage(ImageCache.getSmall(cell.data.items[0]), cell.x * csize, cell.y * csize);
                }
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
            if (player.tickAnim())
                this.busy = true;
        }
        this.display();
        window.requestAnimationFrame( () => this.loop());
    },


    // shows player controls in the pause menu
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
                    <img src="/sprites/old/${player.sprite}.png">
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
    handleTouchInput(action, playerId) {
        let player = this.players.find((obj) => obj.id == playerId);
        if (player) {
            player.handleAction(action, this.grid);
            this.notifyRedraw();
        }
        else {
            console.error("missing player");
        }
    }
};

window.game = Game;
