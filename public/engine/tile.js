import * as Tiles from "./tiles/exports.js";

const tileNameList = [
    "Floor",
    "Wall",
    "Trash",
    "Crate",
    "Counter",
    "CuttingBoard",
    "Delivery"
];

// has 3 attributes: x: int, y: int, proto: Object
// each tile has 3 attributes: sourceImage: string, solid: boolean, data: object
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