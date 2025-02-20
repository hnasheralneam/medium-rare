import { Game } from "./game.js";

const movements = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0]
};

export class Player {
    #listener_function;
    inputMap;

    constructor(inputMap, x, y, sprite) {
        this.sprite = sprite;
        this.inputMap = inputMap;
        this.item = null;
        this.pos = [x, y];
        this.vel = [0, 0];
    }

    deleteItem() {
        this.item = null;
    }

    releaseItem() {
        const item = this.item;
        this.item = null;
        return item;
    }

    giveItem(item) {
        this.item = item;
    }

    hasItem() {
        return this.item !== null;
    }

    keyPressed(e, grid) {
        if (Game.paused) return;
        const key = e.code;
        const action = this.inputMap[key];
        if (action === undefined) return;
        this.handleAction(action, grid);
    }

    /**
     * @param { String } action
     * @param { import("./grid.js").Grid } grid
     */
    handleAction(action, grid) {
        if (action === "interact") grid.interact(this);
        else {
            const move = movements[action];
            if (move === undefined) {
                console.log("Unexpected action:", action);
                return;
            }
            grid.movePlayer(this, move[0], move[1]);
        }
    }
}