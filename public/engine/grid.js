import { Tile } from "./tile.js";
import { Item } from "./item.js";
export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height);
    }

    // helper methods
    inBounds(x, y) {
        return (x < this.width && x >= 0) && (y < this.height && y >= 0);
    }

    tileAt(x, y) {
        return this.cells[x + y * this.width];
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

    interact(player) {
        const tile = this.#getActiveTile(player);
        if (!tile) return;
        const func = tile.proto.onInteract;
        if (func === undefined) return;
        func(tile, player, "interact");
        window.game.notifyRedraw();
        if (window.multiplayer) player.updateRemote();
        return tile;
    }

    loadData(numMap, extraData) {
        for (let i = 0; i < (this.width * this.height); i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            const id = numMap[i];
            const extraRaw = extraData[i];
            const extra = (extraRaw === 0 || extraRaw === undefined) ? null : extraRaw;
            this.cells[i] = new Tile(id, { x, y }, extra);
        }
    }
}

export class RemoteGrid extends Grid {
    upToDate = false;
    awaitingData = false;
    constructor(width, height) {
        super(width, height);
    }

    setIsUpToDate(bool) {
        this.upToDate = bool;
        if (!this.upToDate) {
            this.awaitingData = true;
            this.renewGridData();
        }
    }

    async movePlayer(player, dx, dy) {
        // doesn't need to update because players can go through each other (so no moveable barriers)
        // await this.renewGridData();
        super.movePlayer(player, dx, dy);
    }

    async interact(player) {
        if (this.awaitingData) setTimeout(() => {
            this.interact(player);
        }, 20);
        this.upToDate = true;
        let tile = super.interact(player);
        if (!tile) return;
        this.updateRemoteCell(tile);
    }


    // data managmenet
    exportData() {
        let data = [];
        for (const cell of this.cells) {
            data.push(this.exportCell(cell));
        }
        return data;
    }
    exportCell(cell) {
        return {
            // tile data
            id: cell.id,
            data: cell.data || "no data",
        }
    }
    importData(cells) {
        for (let i = 0; i < (this.width * this.height); i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            const cell = cells[i];
            this.cells[i].create(cell.id, { x, y }, this.importCell(cell));
        }
        return;
    }
    importCell(cell) {
        const data = cell.data;
        // restore items
        if (data && data.item) {
            let item = Item.fromName(data.item.proto.name);
            // restore attributes
            for (const [key, value] of Object.entries(data.item.data)) {
                item.setAttr(key, value);
            }
            data.item = item;
        }
        return data;
    }


    async renewGridData() {
        let old = this.cells;
        await window.socket.emit("getGridData", window.roomid, (data) => {
            if (old == data) return;
            this.importData(data);
        });
        this.awaitingData = false;
        this.upToDate = true;
        window.game.notifyRedraw();
        return;
    }

    async updateRemoteCell(tile) {
        window.socket.emit("setCellData", {
            roomid: window.roomid,
            cell: this.exportCell(tile),
            index: tile.x + tile.y * this.width
        });
    }
}