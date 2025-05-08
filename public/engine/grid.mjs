import { Tile } from "./tile.mjs";

export class ShallowGrid {
    #cells;

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height);
    }

    tileAt(x, y) {
        return this.cells[x + y * this.width];
    }

    loadData(numMap, extraData, serverComms) {
        for (let i = 0; i < (this.width * this.height); i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            const id = numMap[i];
            const extraRaw = extraData[i];
            const extra = (extraRaw === 0 || extraRaw === undefined) ? null : extraRaw;
            this.cells[i] = new Tile(id, { x, y }, extra, serverComms);
        }
    }

    setCell(index, newCellData) {
        const existingCell = this.cells[index];
        existingCell.create(newCellData.id, { x: existingCell.x, y: existingCell.y }, newCellData.data);
    }

    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getCells() {
        return this.cells;
    }
}
export class Grid extends ShallowGrid {
    constructor(width, height) {
        super(width, height);
    }

    // helper methods
    inBounds(x, y) {
        return (x < this.width && x >= 0) && (y < this.height && y >= 0);
    }

    // other methods
    // returns true if possible, false otherwise
    setPlayerDirection(player, dx, dy) {
        player.vel[0] = dx;
        player.vel[1] = dy;
    }
    canMovePlayer(player, dx, dy) {
        const nx = player.pos[0] + dx;
        const ny = player.pos[1] + dy;
        if (!this.inBounds(nx, ny)) return false;
        if (this.tileAt(nx, ny).proto.solid) return false;
        return true;
    }
    movePlayer(player, dx, dy) {
        const nx = player.pos[0] + dx;
        const ny = player.pos[1] + dy;
        player.pos[0] = nx;
        player.pos[1] = ny;
        return true;
    }

    #getActiveTile(player) {
        const tx = player.pos[0] + player.vel[0];
        const ty = player.pos[1] + player.vel[1];
        if (!this.inBounds(tx, ty)) return;
        return this.tileAt(tx, ty);
    }

    // only method that changes grid data
    interact(player) {
        const tile = this.#getActiveTile(player);
        if (!tile) return;
        const func = tile.proto.onInteract;
        if (func === undefined) return;
        func(tile, player, "interact");
        return tile;
    }
}