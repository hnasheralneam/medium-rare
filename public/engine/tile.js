import * as Tiles from "./tiles/exports.js";

const tileNameList = [
    "Floor", // id = 0
    "Wall",
    "Trash",
    "Crate",
    "Counter",
    "CuttingBoard",
    "Delivery",
    "PlatePlace"
];

export class Tile {
    constructor(id, pos, data) {
        this.id = id;
        this.create(id, pos, data);
    }

    create(id, pos, data) {
        const name = tileNameList[id];
        if (name === undefined) throw new Error(`Invalid tile ID: ${id}`);
        const proto = Tiles[name];
        if (proto === undefined) throw new Error(`Unrecognized tile: ${name}`);
        this.x = pos.x;
        this.y = pos.y;
        this.proto = proto;
        proto.init(this, data);
    }
}