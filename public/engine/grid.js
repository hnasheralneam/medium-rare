import { /*Cell,*/ Tile } from "./cell.js";

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

    /**
     * @param { number } x x coordinate of tile
     * @param { number } y y coordinate of tile
     * @return { Tile }
     */
    tileAt(x, y) {
        return this.cells[x + y * this.width];
    }

    checkMovement(player, dx, dy) {
        const nx = player.pos[0] + dx;
        const ny = player.pos[1] + dy;
        if (!this.inBounds(nx, ny)) return false;
        if (this.tileAt(nx, ny).proto.solid) return false;
        return true;
    }

    movePlayer(player, dx, dy) {
        player.vel[0] = dx;
        player.vel[1] = dy;
        const nx = player.pos[0] + dx;
        const ny = player.pos[1] + dy;
        if (!this.inBounds(nx, ny)) return false;
        if (this.tileAt(nx, ny).proto.solid) return false;
        player.pos[0] = nx;
        player.pos[1] = ny;
        return true;
    }

    interact(player) {
        const tx = player.pos[0] + player.vel[0];
        const ty = player.pos[1] + player.vel[1];
        if (!this.inBounds(tx, ty)) return;
        const tile = this.tileAt(tx, ty);
        const func = tile.proto.onInteract;
        if (func === undefined) return;
        func(tile, player, "interact");
    }

    loadData(numMap) {
        if (numMap.length !== this.width * this.height) throw new Error("Mismatched data length");
        const infos = [];
        numMap.forEach(id => infos.push({ id }));
        infos.forEach((info, i) => {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            //this.cells[i] = new Cell(info.id, { x, y }, info.extra);
            this.cells[i] = new Tile(info.id, { x, y }, info.extra);
        });
    }
}