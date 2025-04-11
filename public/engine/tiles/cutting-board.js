import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Item } from "../item.js";

export const CuttingBoard = {
    sourceImage: "cuttingboard.png",
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
        if (player.item === null) {
            /** @type { Item } */
            const item = self.data.item;
            if (item === null) return;
            if (!item.attr("cutted")) {
                item.setAttr("cutted", true);
            }
            else {
                player.giveItem(item);
                self.data.item = null;
            }
        }
        else {
            if (self.data.item !== null) return;
            if (!player.item.proto.cuttable) return;
            self.data.item = player.releaseItem();
        }
    }
};