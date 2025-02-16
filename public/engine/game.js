import * as G from "./graphics.js";
import { Grid } from "./grid.js";
import { Player } from "./player.js";
import { ImageCache } from "./image-cache.js";
import { SaveData, clearSave } from "../storage.js";
import { hideAlerts, showAlerts, createAlert } from "../alertSystem.js";


/*

Level Storage:
Text file (or string)

?<VERSION>
w[WIDTH]
h[HEIGHT]
#0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;

*/

// player start positions should be defined in here as well
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
        maxPlayers: 4
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
        maxPlayers: 4
    },

    square: {
        layout: [
            1, 1, 1, 1, 1, 1, 1,
            1, 3, 0, 0, 0, 6, 1,
            1, 2, 0, 0, 0, 0, 1,
            1, 4, 0, 0, 0, 0, 1,
            1, 5, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1,
        ],
        width: 7,
        height: 7,
        minPlayers: 1,
        maxPlayers: 2
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

    start(level) {
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

        this.level = level;
        this.grid = new Grid(this.level.width, this.level.height);
        this.grid.loadData(this.level.layout);
        for (const player of this.players) {
            this.grid.addPlayer(player);
        }

        this.keydownHandle = (e) => {
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                player.keyPressed(e, this.grid);
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

        showAlerts();
        createAlert(`Game over! Your score is ${Game.stats.score}`);
        if (Game.stats.score >= SaveData.highScore) {
            createAlert("New high score!");
        }
        createAlert("Closing this will reload the game.")
        SaveData.highScore = Math.max(SaveData.highScore, Game.stats.score);
        hideAlerts(() => { location.reload() });

    },

    startTimer() {
        let timeLeft = 60;
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
                ImageCache.getTile(cell.proto.src),
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
            G.drawImage(
                ImageCache.getSprite(player.sprite, player.item === null ? "idle" : "jumping"),
                player.pos[0] * csize,
                player.pos[1] * csize
            );
            if (player.item !== null) {
                G.drawImage(
                    ImageCache.getItem(player.item.src()),
                    player.pos[0] * csize,
                    (player.pos[1] - 1) * csize
                );
            }
        }
        G.restore();
    }
};