import { Tile } from "../tile.js";
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
    init: (self, data) => {
        if (data && data.items) {
            self.data = data;
        }
        else {
            self.data = {};
            if (data !== null)
                self.data.items = [data.item];
            // this should not be an option
            else {
                console.warn("program committed failure (crate.js)");
                self.data.items = ["tomato", "lettuce"];
            }
        }
    },
    /**
     * @param { Tile } self
     * @param { Player } player
     */
    onInteract: (self, player, _key) => {
        if (player.item !== null) return;
        const material = Item.fromName(pickRandom(self.data.items));
        player.giveItem(material);
    }
};