import { Tile } from "../tile.mjs";
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
                if (self.data.item.proto.name == player.item.proto.name) return;
                if (self.data.item.proto.name == "plate" || player.item.proto.name == "plate") {
                    if (player.item.attr("cutted") || RecipeList.find((recipe) => recipe.name == player.item.proto.name)) {
                        self.data.item.addItem(player.releaseItem());
                        return;
                    }
                    if (self.data.item.attr("cutted") || RecipeList.find((recipe) => recipe.name == self.data.item.proto.name)) {
                        let plate = player.releaseItem();
                        plate.addItem(self.data.item);
                        self.data.item = plate;
                        return;
                    }
                }
                // no plates
                let firstItem = player.item;
                let secondItem = self.data.item;
                const result = Recipes.using(firstItem, secondItem);
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