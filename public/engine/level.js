import * as G from "./graphics.js";
import { Grid } from "./grid.js";
import { Player } from "./player.js";
import { ImageCache } from "./image-cache.js";

/*

Level Storage:
Text file (or string)

?<VERSION>
w[WIDTH]
h[HEIGHT]
#0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;

*/

const wideLevel = {
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
    minPlayers: 2
}

const squareLevel = {
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
    minPlayers: 1
}

export const Level = {
    /** @type { Player[] } */
    players: [],
    /** @type { Grid } */
    grid: null,
    keydownHandle: null,

    start() {
        const player1 = new Player({
            movement: {
                ArrowUp: [0, -1],
                ArrowLeft: [-1, 0],
                ArrowDown: [0, 1],
                ArrowRight: [1, 0]
            },
            interact: "Period"
        }, 5, 3, "player");
        const player2 = new Player({
            movement: {
                KeyW: [0, -1],
                KeyA: [-1, 0],
                KeyS: [0, 1],
                KeyD: [1, 0]
            },
            interact: "KeyX"
        }, 3, 3, "player2");

        this.players.push(player1);
        this.players.push(player2);

        let level = wideLevel;
        console.log(level)
        this.grid = new Grid(level.width, level.height);
        this.grid.loadData(level.layout);
        for (const [index, player] of this.players.entries()) {
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
    },

    endGame() {
        document.body.removeEventListener("keydown", this.keydownHandle);
    },
    
    display() {
        const csize = 32;
        // whatcha doing here?
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
                    ImageCache.getItem(cell.item), 
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
                    ImageCache.getItem(player.item),
                    player.pos[0] * csize,
                    (player.pos[1] - 1) * csize
                );
            }
        }
        G.restore();
    }
};