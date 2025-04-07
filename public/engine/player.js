import { Game } from "./game.js";
import { Queue } from "../utils/queue.js";

const movements = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0]
};

const easing = x => x ** 3;

export class Player {
    #listener_function;

    constructor(x, y, sprite) {
        this.sprite = sprite;
        this.item = null;
        this.pos = [x, y];
        this.lastPos = [x, y];
        this.vel = [0, 0];
        this.anim = 0;
    }

    smoothPos() {
        const t = easing(this.anim);
        const [px, py] = this.pos;
        const [lx, ly] = this.lastPos;
        return [px - t * (px - lx), py - t * (py - ly)];
    }

    tickAnim() {
        if (this.anim === 0) return false;
        this.anim = Math.max(0, this.anim - 0.06);
        return true;
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

    /**
     * @param { String } action
     * @param { import("./grid.js").Grid } grid
     */
    handleAction(action, grid) {
        if (action === "interact") {
            if (this.anim > 0.5) return;
            grid.interact(this);
        }
        else {
            const move = movements[action];
            if (move === undefined) {
                return;
            }
            // if (grid.checkMovement(this, move[0], move[1]) && this.anim !== 0) {
            //     //this.pendingActions.offer(action);
            //     return;
            // };
            const [sx, sy] = this.smoothPos();
            if (grid.movePlayer(this, move[0], move[1])) {
                this.anim = 1;
                this.lastPos[0] = sx;
                this.lastPos[1] = sy;
            }
        }
    }
}

export class InputPlayer extends Player {
    #listener_function;
    inputMap;

    constructor(inputMap, x, y, sprite) {
        super(x, y, sprite);
        this.inputMap = inputMap;
    }

    keyPressed(e, grid) {
        if (Game.paused) return;
        const key = e.code;
        const action = this.inputMap[key];
        if (action === undefined) return;
        this.handleAction(action, grid);
    }
}

export class GamepadPlayer extends Player {
    #listener_function;
    gamepadIndex;

    constructor(gamepadIndex, x, y, sprite) {
        super(x, y, sprite);
        this.gamepadIndex = gamepadIndex;
    }

    handleGamepad(grid) {
        if (Game.paused) return;
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (gamepad === null) return;
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        let action = gamepad.buttons[0].pressed ? "interact" : null;
        if (action == null) {
            if (Math.abs(x) > Math.abs(y)) {
                action = x > .3 ? "right" : null;
                if (action == null) action = x < -.3 ? "left" : null;
            }
            else {
                action = y > .3 ? "down" : null;
                if (action == null) action = y < -.3 ? "up" : null;
            }
        }
        if (action === null) return;
        this.handleAction(action, grid);
        Game.notifyRedraw();
    }
}