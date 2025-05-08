import { Tile } from "../tile.mjs";
import { Player } from "../player.js";
import { Item } from "../item.js";

export const PlatePlace = {
    sourceImage: "plateplace.png",
    solid: true,
    init: (self, data) => {
        self.data = {};
        self.data.item = Item.fromName("plate");
    },
    /**
     * @param { Tile } self
     * @param { Player } player
     */
    onInteract: (self, player, _key) => {
        if (player.item !== null) {
            if (player.item.name() == "plate" && player.item.isEmpty()) player.deleteItem();
            return;
        }
        player.giveItem(Item.fromName("plate"));
    }
};