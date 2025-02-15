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

    keyPressed(e, grid) {
        const key = e.code;
        const val = this.inputMap["movement"][key];
        if (val !== undefined) {
            grid.movePlayer(this, val[0], val[1]);
        }
        else if (key === this.inputMap.interact) {
            grid.interact(this);
        }
    }
}