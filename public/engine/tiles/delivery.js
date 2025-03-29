import { Game } from "../game.js";

export const Delivery = {
    sourceImage: "delivery.png",
    solid: true,
    init: (_self, _data) => {},
    onInteract: (_self, player, _key) => {
        Game.orderHandler.submitOrder(player);
    }
};