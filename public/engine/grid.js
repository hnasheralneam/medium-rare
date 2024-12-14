import { Cell } from "./cell.js";

export class Grid {
    /**
     * @param { number } width
     * @param { height } height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height);
        this.px = 0;
        this.py = 0;
        this.lx = -1;
        this.ly = 0;
    }

    setPlayerPos(x, y) {
        this.px = x;
        this.py = y;
    }

    inBounds(x, y) {
        return (x < this.width && x >= 0) && (y < this.height && y >= 0);
    }

    cellAt(x, y) {
        return this.cells[x + y * this.width];
    }

    movePlayer(dx, dy) {
        this.lx = dx;
        this.ly = dy;
        const nx = this.px + dx;
        const ny = this.py + dy;
        if (!this.inBounds(nx, ny)) return;
        if (this.cellAt(nx, ny).proto.solid) return;
        this.px = nx;
        this.py = ny;
    }

    interact(player) {
        const tx = this.px + this.lx;
        const ty = this.py + this.ly;
        if (!this.inBounds(tx, ty)) return;
        const func = this.cellAt(tx, ty).proto.interact;
        if (func === undefined) return;
        func(player, this.cellAt(tx, ty));
    }

    loadData(numMap, extraData) {
        if (numMap.length !== this.width * this.height) throw new Error("Mismatched data length");
        const infos = [];
        numMap.forEach(id => infos.push({ id }));
        extraData.forEach(data => {
            const px = data.pos.x, py = data.pos.y;
            if (px >= this.width || px < 0 || py >= this.height || py < 0) throw new Error("Extra data position out of bounds");
            const index = px + py * this.width;
            infos[index].extra = data.data;
        });
        infos.forEach((info, i) => {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            this.cells[i] = new Cell(info.id, { x, y }, info.extra);
        });
    }


}