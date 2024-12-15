import { ImageCache } from "./image-cache.js";

const items = ["tomato", "lettuce"];

function randomItem() {
    return items[Math.floor(Math.random() * items.length)];
}

/*
 * Schema:
 * 
 * displayName: string
 * srcReq: string[]
 * src: null       # Invisible
 *    | string     # Static image source (immutable)
 *    | cell : str # Parameterized image source
 */

const CellMap = [
    { // 0
        displayName: "air",
        src: "floor.png",
        solid: false,
        init: (_) => {}
    },
    { // 1
        displayName: "wall",
        src: "wall.png",
        solid: true,
        init: (_) => {}
    },
    { // 2
        displayName: "waste bucket",
        src: "trash.png",
        solid: true,
        init: (_) => {},
        interact: (player, _) => {
            if (player.item !== null) player.deleteItem();
        }
    },
    { // 3
        displayName: "raw materials",
        src: "crate.png",
        solid: true,
        init: () => {},
        interact: (player, cell) => {
            if (player.item !== null) return;
            player.item = randomItem();
        }
    },
    { // 4
        displayName: "counter",
        src: "counter.png",
        solid: true,
        init: (cell) => {
            cell.item = cell.extra !== undefined ? cell.extra[0] : null;
        },
        interact: (player, cell) => {
            const playerHasItem = player.item !== null;
            const counterHasItem = cell.item !== null;
            if (playerHasItem && counterHasItem) {
                if (player.item === "salad-sliced" || cell.item === "salid-sliced") return;
                if (player.item.indexOf("sliced") === -1 || cell.item.indexOf("sliced") === -1) return;
                if (player.item === cell.item) return;
                player.item = null;
                cell.item = "salad-sliced";
                return;
            }
            if (playerHasItem === counterHasItem) return;
            if (cell.item === null) cell.item = player.releaseItem();
            else {
                player.giveItem(cell.item);
                cell.item = null;
            }
        }
    },
    { // 5
        displayName: "cutting board",
        src: "cuttingboard.png",
        solid: true,
        init: () => {},
        interact: (player, cell) => {
            if (player.item !== null) {
                cell.item = player.releaseItem();
            }
            else {
                if (cell.item.indexOf("sliced") === -1) cell.item += "-sliced"; 
                else {
                    const item = cell.item;
                    player.giveItem(item);
                    cell.item = null;
                } 
            }
        }
    },
    {
        displayName: "submit",
        src: "delivery.png",
        solid: true,
        init: (_) => {},
        interact: (player, _) => {
            if (player.item === "salad-sliced") {
                player.deleteItem();
                stats.score++;
            }
        }
    }
];



export const stats = {
    score: 0,
};

export class Cell {
    /** @param { number } id */
    constructor(id, pos, extra) {
        const proto = CellMap[id];
        if (proto === undefined) throw new Error(`Invalid cell ID ${id}`);
        this.id = id;
        this.x = pos.x;
        this.y = pos.y;
        this.proto = proto;
        this.extra = extra;
        proto.init(this);
    }

}