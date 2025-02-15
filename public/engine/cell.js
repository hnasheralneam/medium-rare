import { ImageCache } from "./image-cache.js";
import { Game } from "./game.js";
import { Item, Recipes } from "./item.js";
import { Player } from "./player.js";

const items = ["tomato", "lettuce"];

function randomItem() {
    return Item.fromName(items[Math.floor(Math.random() * items.length)]);
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
        src: "floor",
        solid: false,
        init: (_) => {}
    },
    { // 1
        displayName: "wall",
        src: "wall",
        solid: true,
        init: (_) => {}
    },
    { // 2
        displayName: "waste bucket",
        src: "trash",
        solid: true,
        init: (_) => {},
        interact: (player, _) => {
            if (player.item !== null) player.deleteItem();
        }
    },
    { // 3
        displayName: "raw materials",
        src: "crate",
        solid: true,
        init: () => {},
        interact: (player, cell) => {
            if (player.item !== null) return;
            player.item = randomItem();
        }
    },
    { // 4
        displayName: "counter",
        src: "counter",
        solid: true,
        init: (cell) => {
            cell.item = cell.extra !== undefined ? cell.extra[0] : null;
        },
        /**
         * @param { Player } player 
         * @param { Cell } cell 
         */
        interact: (player, cell) => {
            const playerHasItem = player.item !== null;
            const counterHasItem = cell.item !== null;
            if (playerHasItem && counterHasItem) {
                const result = Recipes.using(player.item, cell.item);
                if (result === null) return;
                cell.item = result;
                player.deleteItem();
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
        src: "cuttingboard",
        solid: true,
        init: () => {},
        interact: (player, cell) => {
            if (player.item !== null) {
                if (cell.item !== null || cell.item !== undefined) return;
                cell.item = player.releaseItem();
                return;
            }
            if (!cell.item.proto.cuttable) return;
            cell.item.setAttr("cutted", true);
        }
    },
    {
        displayName: "submit",
        src: "delivery",
        solid: true,
        init: (_) => {},
        interact: (player, _) => {
            if (player.item === "salad-sliced") {
                player.deleteItem();
                Game.stats.score++;
            }
        }
    }
];


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
