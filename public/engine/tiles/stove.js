import { Item } from "../item.js";

export const Stove = {
    sourceImage: "stove-off.png",
    solid: true,
    init: (self, data) => {
        if (data) self.data = data;
        else {
            self.data = {};
            self.data.item = Item.fromName("pot");
        }
    },
    onInteract: (self, player, _key) => {
        if (player.item === null && self.data.item) {
            player.giveItem(self.data.item);
            self.data.item = null;
        }
        else if (!self.data.item && player.item && player.item.isContainer() && player.item.proto.name == "pot") {
            self.data.item = player.releaseItem();
        }
    }
};