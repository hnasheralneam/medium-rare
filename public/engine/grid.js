import { Tile } from "./tile.js";
import { Item } from "./item.js";
export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height);
    }

    inBounds(x, y) {
        return (x < this.width && x >= 0) && (y < this.height && y >= 0);
    }

    tileAt(x, y) {
        return this.cells[x + y * this.width];
    }

    // return true if successful, false otherwise
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
    constructor(width, height) {
        super(width, height);
    }

    async movePlayer(player, dx, dy) {
        await this.renewGridData();
        let result = super.movePlayer(player, dx, dy);
        return result;
    }

    async interact(player) {
        await this.renewGridData();
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
            x: cell.x, // may not need to send
            y: cell.y, // may not need to send
            data: cell.data || "no data",
        }
    }
    importData(cells) {
        for (let i = 0; i < (this.width * this.height); i++) {
            const x = i % this.width; // so maybe don't send them?
            const y = Math.floor(i / this.width); // so maybe don't send them?
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
        return;
    }
    async updateRemoteGridData() {
        window.socket.emit("setGridData", {
            roomid: window.roomid,
            grid: this.exportData()
        });
    }
    async updateRemoteCell(tile) {
        window.socket.emit("setCellData", {
            roomid: window.roomid,
            cell: this.exportCell(tile),
            index: tile.x + tile.y * this.width
        });
    }
}