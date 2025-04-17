import { Game } from "./game.js";
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

    handleAction(action, grid) {
        if (Game.paused) return;
        // multiplayer sync for interact is happening over in grid.js
        if (action === "interact") {
            if (this.anim > 0.5) return;
            grid.interact(this);
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

            // multiplayer sync
            if (window.multiplayer && this.constructor.name != "RemotePlayer") {
                window.socket.emit("playerMoved", {
                    roomid: window.roomid,
                    playerid: this.id,
                    move: move
                });
            }
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

    updateRemote() {
        if (this.constructor.name == "RemotePlayer") return;
        window.socket.emit("setPlayer", {
            roomid: window.roomid,
            id: this.id,
            data: {
                item: this.item
            }
        });
    }
}

export class RemotePlayer extends Player {
    constructor(pos, sprite, id) {
        super(pos, sprite, id);
    }

    move(action, grid) {
        this.handleMove(action, grid);
        window.game.notifyRedraw();
    }

    give(itemJSON) {
        if (itemJSON) {
            let item = Item.fromName(itemJSON.proto.name);
            // restore attributes
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
    gamepadIndex;

    constructor(gamepadIndex, pos, sprite, id) {
        super(pos, sprite, id);
        this.gamepadIndex = gamepadIndex;
        this.interactPressed = false;
        this.lastMove = Date.now();
        this.cooldown = 150;
    }

    handleGamepad(grid) {
        if (Game.paused) return;
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
        if (action === null) return;
        this.handleAction(action, grid);
        Game.notifyRedraw();
    }
}

export class TouchPlayer extends Player {
    constructor(pos, sprite, id) {
        super(pos, sprite, id);
    }
}