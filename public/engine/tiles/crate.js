import { Tile } from "../cell.js";
import { Player } from "../player.js";
import { Item } from "../item.js";

/**
 * @param { any[] } list
 * @return { any }
 */
function pickRandom(list) {
    const index = (list.length * Math.random()) | 0;
    return list[index];
}

export const Crate = {
    sourceImage: "crate.png",
    solid: true,
    init: (self, _data) => {
        self.items = ["tomato", "lettuce"];
    },
    /**
     * @param { Tile } self
     * @param { Player } player
     */
    onInteract: (self, player, _key) => {
        if (player.item !== null) return;
        const material = Item.fromName(pickRandom(self.items));
        player.giveItem(material);
    }
};