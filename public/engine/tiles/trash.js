/**
 * @typedef { import("../player.js").Player } Player
 */

export const Trash = {
    sourceImage: "trash.png",
    solid: true,
    init: (_self, _data) => {
        //self.deletedItems = [];
    },
    beforeDraw: (self) => [], // For decorations
    /**
     * @param { Player } player
     */
    onInteract: (_self, player, _key) => {
        player.deleteItem();
    }
};