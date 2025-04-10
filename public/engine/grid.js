import { Tile } from "./tile.js";

export class Grid {
    /**
     * @param { number } width
     * @param { height } height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height);
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

    loadData(numMap, extraData) {
        for (let i = 0; i < (this.width * this.height); i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            const id = numMap[i];
            const extraRaw = extraData[i];
            const extra = (extraRaw === 0 || extraRaw === undefined) ? null : extraRaw;
            this.cells[i] = new Tile(id, { x, y }, extra); // ininted from within Tile
        }
    }
}

export class RemoteGrid extends Grid {
    constructor(width, height) {
        super(width, height);
    }

    async movePlayer(player, dx, dy) {
        await this.renewCellData();
        let result = super.movePlayer(player, dx, dy);
        this.updateRemotePlayer(player.id, player.pos);
        return result;
    }

    async interact(player) {
        await this.renewCellData();
        let results = super.interact(player);
        this.updateRemoteCellData();
        return results;
    }


    setPlayerPosition(player, x, y) {
        player.pos[0] = x;
        player.pos[1] = y;
        return true;
    }

    // multiplayer
    reloadData(objectCells) { // is in the format of cells that were tiles, but had methods stripped in transit
        // for (let i = 0; i < (this.width * this.height); i++) {
        //     const x = i % this.width;
        //     const y = Math.floor(i / this.width);
        //     const id = numMap[i];
        //     const extraRaw = extraData[i];
        //     const extra = (extraRaw === 0 || extraRaw === undefined) ? null : extraRaw;
        //     this.cells[i] = new Tile(id, { x, y }, extra); // initialized from within Tile
        // }
        // console.log(objectCells)
        return;
    }

    async renewCellData() {
        let self = this;
        let old = this.cells;
        window.socket.emit("getCellData", window.roomid, (data) => {
            self.cells = data;
        });
        // console.log("getting the data")
        return this.reloadData(this.cells);
    }

    async updateRemoteCellData() {
        window.socket.emit("setCellData", {
            roomid: window.roomid,
            grid: this.cells
        });
        // console.log("setting the data!")
    }

    async updateRemotePlayer(id, pos) {
        window.socket.emit("updatePlayerData", {
            roomid: window.roomid,
            playerid: id,
            pos: pos
        });
        // console.log("setting the data!")
    }
}