export const Delivery = {
    sourceImage: "delivery.png",
    solid: true,
    init: (_self, _data) => {},
    onInteract: (self, player, _key) => {
        self.serverComms.server.orderHandler.submitOrder(player);
    }
};