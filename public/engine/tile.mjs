import * as Tiles from "./tiles/exports.js";
import { Item } from "./item.js";

const tileNameList = [
    "Floor", // id = 0
    "Wall",
    "Trash",
    "Crate",
    "Counter",
    "CuttingBoard",
    "Delivery",
    "PlatePlace",
    "Stove"
];

export class Tile {
    constructor(id, pos, data, serverComms) {
        this.id = id;
        this.serverComms = serverComms;
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

Tile.prototype.toJSON = function() {
    const serializableData = {};
    if (this.data) {
        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                const value = this.data[key];
                if (key === 'item' && value instanceof Item) {
                    serializableData.item = value.toJSON();
                } else if (key === 'items' && Array.isArray(value)) {
                    serializableData.items = value.map(v => (v instanceof Item) ? v.toJSON() : v);
                } else {
                    serializableData[key] = value;
                }
            }
        }
    }
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        data: serializableData
    };
};