import * as G from "./graphics.js";
import { KeyboardPlayer, GamepadPlayer, TouchPlayer, RemotePlayer } from "./player.js";
import { ImageCache } from "./image-cache.js";
import { SaveData } from "../storage.js";
import { DisplayController } from "./displayController.js";
import { ShallowGrid } from "./grid.mjs";
import { PlayerHandler } from "./playerHandler.js";
import { setLevelData } from "../levelDataParser.js";
import { rehydrateItem } from "./itemRehydrator.js";

class Game {
    players = [];
    grid = null;
    keydownHandle = null; // checked if null as a hacky "has game started" check in PlayerHandler
    busy = false;
    comms;

    constructor(comms) {
        this.comms = comms;
    }

    getComms() {
        return this.comms;
    }

    init(levelData) {
        this.grid = new ShallowGrid(levelData.width, levelData.height);
        this.grid.loadData(levelData.layout, levelData.extra);
        setLevelData(levelData);
        PlayerHandler.init(levelData);
    }

    start() {
        PlayerHandler.stopAcceptingNewPlayers();
        for (const player of PlayerHandler.pendingPlayers) {
            this.addPlayer(player);
        }

        this.startHandlingKeyboardInput();
        this.initControlsDisplay();
        this.display();
    }

    startHandlingKeyboardInput() {
        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                if (player.constructor.name === "KeyboardPlayer")
                    player.keyPressed(e);
            }
        }
        document.body.addEventListener("keydown", this.keydownHandle);
    }

    addPlayer(pendingPlayer) {
        if (this.players.find(p => p.id === pendingPlayer.id)) {
            console.warn(`Game.addPlayer: Player with ID ${pendingPlayer.id} already exists. Skipping.`);
            return;
        }

        let player;
        if (pendingPlayer.type == "gamepad") {
            let index = pendingPlayer.index;
            player = new GamepadPlayer(index, pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
            setInterval(() => {
                player.handleGamepad();
            }, 50);
        }
        else if (pendingPlayer.type == "keyboard") player = new KeyboardPlayer(pendingPlayer.inputMap, pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        else if (pendingPlayer.type == "touch") player = new TouchPlayer(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        else if (pendingPlayer.type == "remote") player = new RemotePlayer(pendingPlayer.pos, pendingPlayer.sprite, pendingPlayer.id);
        if (player) {
            this.players.push(player);
        }
    }

    display() {
        const csize = 32;
        const offset = {
            x: this.grid.getWidth() / 2 * csize,
            y: this.grid.getHeight() / 2 * csize
        };
        G.pushModifier(-offset.x, -offset.y);

        G.clear("#000");
        // draw cells
        for (const cell of this.grid.getCells()) {
            G.drawImage(ImageCache.getTile("floor.png"), cell.x * csize, cell.y * csize);
            G.drawImage(ImageCache.getTile(cell.proto.sourceImage), cell.x * csize, cell.y * csize);
        }

        let playersGrid = [];
        for (let i = 0; i < this.grid.getWidth(); i++) playersGrid.push([]);
        playersGrid.forEach(() => {
            for (let i = 0; i < this.grid.getHeight(); i++) playersGrid[i].push(null);
        });

        // is using incorrect player array
        for (const player of this.players) {
            if (!playersGrid[player.pos[0]][player.pos[1]]) playersGrid[player.pos[0]][player.pos[1]] = [];
            playersGrid[player.pos[0]][player.pos[1]].push(player);
        }

        // draw items on cells
        for (const cell of this.grid.getCells()) {
            // draw grid items
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
            // draw grid players
            if (playersGrid[cell.x][cell.y]) {
                const players = playersGrid[cell.x][cell.y];
                for (let player of players) {
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
            }
        }
        G.restore();
    }

    notifyRedraw() {
        if (this.busy) return;
        this.busy = true;
        window.requestAnimationFrame(() => this.loop());
    }

    loop() {
        if (!this.busy) return;
        this.busy = false;
        for (const player of this.players) {
            if (player.tickAnim())
                this.busy = true;
        }
        this.display();
        window.requestAnimationFrame( () => this.loop());
    }


    // shows player controls in the pause menu
    initControlsDisplay() {
        DisplayController.createPlayerControlsElements(this.players);
    }

    end({ score, failedOrders, completedOrders }) {
        document.body.removeEventListener("keydown", this.keydownHandle);

        const postGamePanel = document.querySelector(".post-game");
        postGamePanel.classList.remove("hidden");
        postGamePanel.innerHTML = `
        <div>
            <h2>Game Complete!</h2>
            <h1>Your score:  ${score}</h1>
            ${window.multiplayer ? '' : `<span>${score >= SaveData[window.levelName + "HighScore"] ? "New high score!" : ""}</span>`}
            <p>Completed ${completedOrders} orders, failed ${failedOrders} orders</p>
            ${window.multiplayer ? '' : '<button onclick="location.reload()">Play again</button>'}
            <button onclick="window.location = window.location.origin">Home</button>
        </div>
        `;
        document.addEventListener("keypress", (e) => {
            if (e.key == "Enter") {
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

        if (!window.multiplayer && score >= SaveData[window.levelName + "HighScore"]) {
            SaveData[window.levelName + "HighScore"] = score;
        }
    }

    handleTouchInput(action, playerId) {
        let player = this.players.find((obj) => obj.id == playerId);
        if (player) this.emitPlayerAction(player, action);
        else console.error("missing player");
    }

    emitPlayerAction(player, action) {
        this.comms.emitPlayerAction(player, action);
    }

    updatePlayer(fromLocal, player) {
        const localPlayer = this.players.find((obj) => obj.id == player.id);
        if (!localPlayer) return;

        if (localPlayer.pos == player.pos) return;
        const isNewMoveStarting = player.anim === 1 && (localPlayer.pos[0] !== player.pos[0] || localPlayer.pos[1] !== player.pos[1]);

        if (isNewMoveStarting) localPlayer.lastPos = [...localPlayer.pos];
        else localPlayer.lastPos = [...player.pos];

        localPlayer.anim = player.anim;
        localPlayer.flipped = player.flipped;
        localPlayer.pos = [...player.pos];
        if (player.item) localPlayer.item = fromLocal ? player.item : rehydrateItem(player.item);
        else localPlayer.item = null;

        localPlayer.subscribers = player.subscribers;
        localPlayer.vel = player.vel;
        this.notifyRedraw();
    }
};

export function createGame(comms) {
   return new Game(comms);
}
