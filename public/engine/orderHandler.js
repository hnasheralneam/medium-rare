let maxOrders = 3;

export const OrderHandler = {
    mealOptions: [],
    orders: [],
    completedOrders: [],
    failedOrders: [],
    orderCount: 0,

    init(mealOptions, serverComms) {
        this.mealOptions = mealOptions;
        this.serverComms = serverComms;
        // speed of order generation should be defined in the level
        // consider using an array of times instead
        setTimeout(() => { this.attemptAddingOrder(); }, 2000);
        setTimeout(() => { this.attemptAddingOrder(); }, 10000);
        setTimeout(() => { this.attemptAddingOrder(); }, 25000);
        setTimeout(() => { this.attemptAddingOrder(); }, 40000);
        setTimeout(() => { this.attemptAddingOrder(); }, 50000);
    },

    attemptAddingOrder() {
        if (this.orders.length < maxOrders) {
            this.generateOrder();
            return true;
        }
        else {
            return false;
        }
    },

    generateOrder() {
        let meal = this.mealOptions[Math.floor(Math.random() * this.mealOptions.length)];
        let newOrderData = {
            name: meal,
            time: 25000,
            number: ++this.orderCount
        };
        this.orders.push(newOrderData);
        this.serverComms.emitCreateOrder(newOrderData);
    },

    submitOrder(player) {
        if (player.item === null || player.item.name() != "plate") return;
        if (this.mealOptions.includes(player.item.getItems()[0].name())) {
            let orderData = this.orders.find(o => o.name == player.item.getItems()[0].name());
            if (orderData) {
                this.serverComms.emitFilledOrder(orderData.number);
                this.closeOrder(orderData.number, false);
                this.serverComms.emitIncreaseScore();
                player.deleteItem();
            }
        }
    },

    closeOrder(number, failed) {
        let order = this.orders.find(o => o.number == number);
        if (!order) return;
        if (!failed) this.completedOrders.push(order);
        else {
            this.failedOrders.push(order);
        }
        this.orders.splice(this.orders.indexOf(order), 1);
        // should take away time/score and give visual feedback
        if (this.orders.length == 0) {
            setTimeout(() => { this.generateOrder(); }, 2000);
        }
    }
}