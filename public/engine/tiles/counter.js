import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Recipes, RecipeList } from "../item.js";

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
                if (
                    (self.data.item.proto.name == "plate" && player.item.proto.name != "plate")
                    ||
                    (self.data.item.proto.name != "plate" && player.item.proto.name == "plate")
                ) {
                    if (player.item.attr("cutted") || RecipeList.find((recipe) => recipe.name == player.item.proto.name)) {
                        player.item.setAttr("hasPlate", true);
                        self.data.item = player.releaseItem();
                        return;
                    }
                    if (self.data.item.attr("cutted") || RecipeList.find((recipe) => recipe.name == self.data.item.proto.name)) {
                        player.releaseItem();
                        self.data.item.setAttr("hasPlate", true);
                        return;
                    }
                }
                if (player.item.attr("hasPlate") && self.data.item.attr("hasPlate")) return;
                let hasPlate = player.item.attr("hasPlate") || self.data.item.attr("hasPlate");
                const result = Recipes.using(player.item, self.data.item);
                if (result === null) return;
                self.data.item = result;
                if (hasPlate) self.data.item.setAttr("hasPlate", true);
                player.deleteItem();
                return;
            }
            player.giveItem(self.data.item);
            self.data.item = null;
        }
    }
};