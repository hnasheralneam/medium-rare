import*as G from "./graphics.js";
import {Grid, RemoteGrid} from "./grid.js";
import {Player, KeyboardPlayer, GamepadPlayer, RemotePlayer} from "./player.js";
import {ImageCache} from "./image-cache.js";
import {OrderHandler} from "./orderHandler.js";
import {SaveData} from "../storage.js";

let inputMaps = [{
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Period: "interact"
}, {
    KeyW: "up",
    KeyA: "left",
    KeyS: "down",
    KeyD: "right",
    KeyQ: "interact",
    KeyE: "interact"
}];
let playerSprites = ["player", "player2", "player3", "player4"];
window.levelNames = ["square", "wide", "huge"]

// these are only available before the game starts
window.addEventListener("gamepadconnected", (e) => {
    Game.addGamepadPlayer(e.gamepad.index);
}
);
document.body.addEventListener("keydown", keyboardPlayerConnectionListener);
function keyboardPlayerConnectionListener(e) {
    const key = e.code;
    switch (key) {
    case "KeyW":
    case "KeyA":
    case "KeyS":
    case "KeyD":
        Game.addKeyboardPlayer(1);
        break;
    case "ArrowUp":
    case "ArrowLeft":
    case "ArrowDown":
    case "ArrowRight":
        Game.addKeyboardPlayer(0);
        break;
    }
}
document.body.addEventListener("touchstart", () => {
    let touchPad = document.createElement("div");
    touchPad.classList.add("touchpad");
    touchPad.innerHTML = `

    `;
    // then insert the html elemnt
    // the id for the touchpad player can be generated here and inserted into the function calls for this (handleTouchInput(id, action)), where they will be routed to the correct player
});

function getRandomSprite() {
    return playerSprites[Math.floor(Math.random() * playerSprites.length)];
}

export const Game = {
    /** @type { Player[] } */
    players: [],
    pendingPlayers: [],
    /** @type { Grid } */
    grid: null,
    keydownHandle: null,
    paused: false,
    stats: {
        score: 0
    },
    busy: false,
    gamepadPlayerIndexs: [],
    keyboardPlayerInputMaps: [],
    initialized: false,
    playerIndex: 0,

    addGamepadPlayer(index) {
        let id = window.crypto.randomUUID();
        let pendingPlayer = {
            type: "gamepad",
            sprite: getRandomSprite(),
            index: index,
            id: id,
            pos: this.getNextPos()
        };
        this.pendingPlayers.push(pendingPlayer);
        this.gamepadPlayerIndexs.push(index);
        window.updatePlayersOnPregameDisplay();

        if (window.multiplayer) {
            window.socket.emit("addPlayer", {
                roomid: window.roomid,
                id: id,
                sprite: pendingPlayer.sprite,
                startPos: pendingPlayer.pos
            });
        }
    },
    addKeyboardPlayer(inputMapIndex) {
        let id = window.crypto.randomUUID();
        let inputMap = inputMaps[inputMapIndex];
        if (!this.keyboardPlayerInputMaps.includes(inputMap)) {
            let pendingPlayer = {
                type: "keyboard",
                sprite: getRandomSprite(),
                inputMap: inputMap,
                id: id,
                mapIndex: inputMapIndex,
                pos: this.getNextPos()
            };
            this.pendingPlayers.push(pendingPlayer);
            this.keyboardPlayerInputMaps.push(inputMap);
            window.updatePlayersOnPregameDisplay();

            if (window.multiplayer) {
                window.socket.emit("addPlayer", {
                    roomid: window.roomid,
                    id: id,
                    sprite: pendingPlayer.sprite,
                    startPos: pendingPlayer.pos
                });
            }
        }
    },
    // for pre-game players specifically
    getPlayerCount() {
        return this.gamepadPlayerIndexs.length + this.keyboardPlayerInputMaps.length;
        // should also count remote players
    },
    getNextPos() {
        let pos = this.level.playerPositions[this.playerIndex] || this.level.playerPositions[0];
        this.playerIndex++;
        return pos;
    },

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
        document.body.removeEventListener("keydown", keyboardPlayerConnectionListener);

        for (const pendingPlayer of this.pendingPlayers) {
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
