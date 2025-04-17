export const Trash = {
    sourceImage: "trash.png",
    solid: true,
    init: (_self, _data) => {},
    onInteract: (_self, player, _key) => {
        if (player.item.isContainer()) player.item.emptyContainer();
        else player.deleteItem();
    }
};