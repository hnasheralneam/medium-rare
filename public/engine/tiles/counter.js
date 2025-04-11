import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Recipes } from "../item.js";

export const Counter = {
    sourceImage: "counter.png",
    solid: true,
    init: (self, _data) => {
        self.data = {};
        self.data.item = null;
    },
    reinit(self, item) {
        self.data.item = item;
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