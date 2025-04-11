import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Recipes } from "../item.js";

export const Counter = {
    sourceImage: "counter.png",
    solid: true,
    init: (self, data) => {
        if (data) {
            self.data = data;
        }
        else {
            self.data = {};
            self.data.item = null;
        }
    },
    /**
     * @param { Tile } self
     * @param { Player } player
     */
    onInteract: (self, player, _key) => {
        if (self.data.item === null) {
            if (player.item === null) return;
            self.data.item = player.releaseItem();
        }
        else {
            if (player.item !== null) {
                const result = Recipes.using(player.item, self.data.item);
                if (result === null) return;
                self.data.item = result;
                player.deleteItem();
                return;
            }
            player.giveItem(self.data.item);
            self.data.item = null;
        }
    }
};