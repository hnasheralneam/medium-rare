import { Game } from "../state.js";
import { Item } from "./item.js";

const movements = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0]
};

const easing = x => x ** 3;

export class Player {
    item = null;
    vel = [0, 0];
    anim = 0;
    flipped = false;
    subscribers = [];

    constructor(pos, sprite, id) {
        let x = pos[0];
        let y = pos[1];
        this.sprite = sprite;
        this.pos = [x, y];
        this.lastPos = [x, y];
        this.id = id;
    }

    getId() {
        return this.id;
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
        Game.getComms().updateTickAnim(this.id, this.anim);
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

    setType(type) {
        this.type = type;
    }

    getType() {
        return this.type;
    }

    handleAction(action, grid, anim, interactCallback) {
        if (action === "interact") {
            if (this.anim > 0.5) return;
            let tile = grid.interact(this);
            if (tile) interactCallback(tile);
        }
        else {
            const move = movements[action];
            if (move === undefined) return;
            this.handleMove(move, grid);
        }
    }

    handleMove(move, grid) {
        const [sx, sy] = this.smoothPos();
        if (move[0] > 0.1)
            this.flipped = true;
        else if (move[0] < -0.1)
            this.flipped = false;

        grid.setPlayerDirection(this, move[0], move[1]);
        if (grid.canMovePlayer(this, move[0], move[1])) {
            grid.movePlayer(this, move[0], move[1]);
            this.anim = 1;
            this.lastPos[0] = sx;
            this.lastPos[1] = sy;

            this.subscribers.forEach((subscriber) => {
                subscriber.proto.disconnect(subscriber);
                this.removeSubscriber(subscriber);
            });
        }
    }

    addSubscriber(tile) {
        if (!this.subscribers.includes(tile))
            this.subscribers.push(tile);
    }
    removeSubscriber(tile) {
        let index = this.subscribers.indexOf(tile);
        if (index != -1) this.subscribers.splice(index, 1);
    }

    emitPlayerAction(player, action) {
        Game.getComms().emitPlayerAction(player, action);
    }
}

export class RemotePlayer extends Player {
    constructor(pos, sprite, id) {
        super(pos, sprite, id);
    }

    move(action, grid) {
        this.handleMove(action, grid);
    }

    give(itemJSON) {
        if (itemJSON) {
            let item = Item.fromName(itemJSON.proto.name);
            for (const [key, value] of Object.entries(itemJSON.data)) {
                item.setAttr(key, value);
            }
            this.giveItem(item);
        }
        else {
            this.releaseItem();
        }
    }
}

export class KeyboardPlayer extends Player {
    inputMap;

    constructor(inputMap, pos, sprite, id) {
        super(pos, sprite, id);
        this.inputMap = inputMap;
        this.lastMove = Date.now();
        this.cooldown = 80;
    }

    keyPressed(e) {
        const key = e.code;
        const action = this.inputMap[key];
        if (action == undefined) return;
        if (action != "interact") {
            if (Date.now() - this.lastMove < this.cooldown) return;
            this.lastMove = Date.now();
        }
        this.emitPlayerAction(this, action);
    }
}

export class GamepadPlayer extends Player {
    gamepadIndex;

    constructor(gamepadIndex, pos, sprite, id) {
        super(pos, sprite, id);
        this.gamepadIndex = gamepadIndex;
        this.interactPressed = false;
        this.lastMove = Date.now();
        this.cooldown = 190;
    }

    handleGamepad() {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (gamepad === null) return;
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        let action;
        if (gamepad.buttons[0].pressed && this.interactPressed == false) {
            action = "interact";
        }
        this.interactPressed = gamepad.buttons[0].pressed;
        if (action == null && Date.now() - this.lastMove > this.cooldown) {
            if (Math.abs(x) > Math.abs(y)) {
                action = x > .3 ? "right" : null;
                if (action == null) action = x < -.3 ? "left" : null;
            }
            else {
                action = y > .3 ? "down" : null;
                if (action == null) action = y < -.3 ? "up" : null;
            }
            if (action != null) {
                this.lastMove = Date.now();
            }
        }
        if (action == null) return;
        this.emitPlayerAction(this, action);
    }
}

export class TouchPlayer extends Player {
    constructor(pos, sprite, id) {
        super(pos, sprite, id);
    }
}