import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Recipes } from "../item.js";

export const Counter = {
    sourceImage: "counter.png",
    solid: true,
    init: (self, _data) => {
        self.item = null;
    },
    /**
     * @param { Tile } self
     * @param { Player } player 
     */
    onInteract: (self, player, _key) => {
        if (self.item === null) {
            if (player.item === null) return;
            self.item = player.releaseItem();
        } 
        else {
            if (player.item !== null) {
                const result = Recipes.using(player.item, self.item);
                if (result === null) return;
                self.item = result;
                player.deleteItem();
                return;
            }
            player.giveItem(self.item);
            self.item = null;
        }
    }
};