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
        this.players = [];
    }

    addPlayer(player) {
        this.players.push(player);
    }

    inBounds(x, y) {
        return (x < this.width && x >= 0) && (y < this.height && y >= 0);
    }

    cellAt(x, y) {
        return this.cells[x + y * this.width];
    }

    movePlayer(player, dx, dy) {
        player.vel[0] = dx;
        player.vel[1] = dy;
        const nx = player.pos[0] + dx;
        const ny = player.pos[1] + dy;
        if (!this.inBounds(nx, ny)) return;
        if (this.cellAt(nx, ny).proto.solid) return;
        player.pos[0] = nx;
        player.pos[1] = ny;
    }

    interact(player) {
        const tx = player.pos[0] + player.vel[0];
        const ty = player.pos[1] + player.vel[1];
        if (!this.inBounds(tx, ty)) return;
        const func = this.cellAt(tx, ty).proto.interact;
        if (func === undefined) return;
        func(player, this.cellAt(tx, ty));
    }

    loadData(numMap) {
        if (numMap.length !== this.width * this.height) throw new Error("Mismatched data length");
        const infos = [];
        numMap.forEach(id => infos.push({ id }));
        infos.forEach((info, i) => {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            this.cells[i] = new Cell(info.id, { x, y }, info.extra);
        });
    }
}