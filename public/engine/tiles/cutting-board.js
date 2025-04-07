import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Item } from "../item.js";

export const CuttingBoard = {
    sourceImage: "cuttingboard.png",
    solid: true,
    init: (self, _data) => {
        self.item = null;
    },
    /**
     * @param { Tile } self
     * @param { Player } player 
     */
    onInteract: (self, player, _key) => {
        if (player.item === null) {
            /** @type { Item } */
            const item = self.item;
            if (item === null) return;
            if (!item.attr("cutted")) {
                item.setAttr("cutted", true);
            }
            else {
                player.giveItem(item);
                self.item = null;
            }
        }
        else {
            if (self.item !== null) return;
            if (!player.item.proto.cuttable) return;
            self.item = player.releaseItem();
        }
    }
};