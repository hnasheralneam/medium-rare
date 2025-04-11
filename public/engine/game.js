import * as G from "./graphics.js";
import {Grid, RemoteGrid} from "./grid.js";
import {Player, KeyboardPlayer, GamepadPlayer, RemotePlayer} from "./player.js";
import {ImageCache} from "./image-cache.js";
import {OrderHandler} from "./orderHandler.js";
import {SaveData} from "../storage.js";
import { PlayerHandler } from "./playerHandler.js";

window.levelNames = ["square", "wide", "huge"];

export const Game = {
    players: [], // Player array
    grid: null, // Grid / RemoteGrid
    keydownHandle: null,
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
        PlayerHandler.gameStarted();

        for (const pendingPlayer of PlayerHandler.pendingPlayers) {
            this.addPlayer(pendingPlayer);
        }

        // get remote users if multiplayer
        let callback = (data) => {
            for (const player of data.players) {
                if (this.players.some( (item) => item.id == player.id))
                    continue;
                this.addPlayer({
                    type: "remote",
                    sprite: player.sprite,
                    id: player.id,
                    pos: player.startPos
                });
                this.playerIndex++;
            }
            this.notifyRedraw();
        }
        ;
        if (window.multiplayer)
            socket.emit("getPlayers", window.roomid, callback);

        this.orderHandler = new OrderHandler(this.level.menuOptions);

        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                if (player.constructor.name === "KeyboardPlayer") {
                    player.keyPressed(e, this.grid);
                    if (player.anim === 1)
                        this.notifyRedraw();
                }
            }

            // this will be called only when the listener is set
            this.display();
        }
        ;
        document.body.addEventListener("keydown", this.keydownHandle);

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

    addPlayer(pendingPlayer) {
        let player;
        if (pendingPlayer.type == "gamepad") {
            let index = this.gamepadPlayerIndexs[pendingPlayer.index];
            player = new GamepadPlayer(index,pendingPlayer.pos,pendingPlayer.sprite,pendingPlayer.id);
            this.players.push(player);

            setInterval( () => {
                player.handleGamepad(this.grid);
            }
            , 50);
        } else if (pendingPlayer.type == "keyboard") {
            player = new KeyboardPlayer(pendingPlayer.inputMap,pendingPlayer.pos,pendingPlayer.sprite,pendingPlayer.id,);
        } else if (pendingPlayer.type == "remote") {
            player = new RemotePlayer(pendingPlayer.pos,pendingPlayer.sprite,pendingPlayer.id);
        }
        if (player) {
            this.players.push(player);
        }
    },

    async getLevelData(levelName) {
        const url = `/resources/levels/${levelName}.json`;
        return await fetch(url).then(x => x.text()).then(y => {
            return JSON.parse(y);
        }
        );
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
            <button onclick="location.reload()">Play again</button>
            <button onclick="window.location = window.location.origin">Home</button>
        </div>
        `;
        if (Game.stats.score >= SaveData[window.levelName + "HighScore"]) {
            SaveData[window.levelName + "HighScore"] = Game.stats.score;
        }
        document.addEventListener("keypress", (e) => {
            if (e.key == "Enter") {
                location.reload();
            }
        }
        );
    },

    startTimer() {
        let timeLeft = this.level.timeSeconds;
        document.querySelector(".timer").textContent = timeLeft + " seconds | 0 Points";
        this.timer = setInterval( () => {
            if (this.paused)
                return;
            if (timeLeft <= 0) {
                this.end();
                return;
            }
            timeLeft--;
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

    initControlsDisplay() {
        // this isn't working anymore
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
            G.drawImage(ImageCache.getTile(cell.proto.sourceImage), cell.x * csize, cell.y * csize);
            if (cell.data && cell.data.item !== null && cell.data.item !== undefined) {
                G.drawImage(ImageCache.getItem(cell.data.item.src()), cell.x * csize, cell.y * csize);
            }
        }
        for (const player of this.players) {
            const pos = player.smoothPos();
            if (player.flipped)
                G.drawMirroredImage(ImageCache.getSprite(player.sprite, player.item === null ? "idle" : "jumping"), pos[0] * csize, pos[1] * csize);
            else
                G.drawImage(ImageCache.getSprite(player.sprite, player.item === null ? "idle" : "jumping"), pos[0] * csize, pos[1] * csize);
            if (player.item !== null) {
                G.drawImage(ImageCache.getItem(player.item.src()), pos[0] * csize, (pos[1] - 1) * csize);
            }
        }
        G.restore();
    },

    notifyRedraw() {
        // should be called for all players when multiplayer
        if (this.busy)
            return;
        this.busy = true;
        window.requestAnimationFrame( () => this.loop());
    },

    loop() {
        if (!this.busy)
            return;
        this.busy = false;
        for (const player of this.players) {
            if (player.tickAnim())
                this.busy = true;
        }
        this.display();
        window.requestAnimationFrame( () => this.loop());
    }
};

window.game = Game;
