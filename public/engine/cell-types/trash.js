export const Trash = {
    sourceImage: "trash.png",
    solid: true,
    init: (self, data) => {
        self.deletedItems = [];
    },
    beforeDraw: (self) => [], // For decorations
    onInteract: (self, player, key) => {
        console.log("implement delete");
    }
}