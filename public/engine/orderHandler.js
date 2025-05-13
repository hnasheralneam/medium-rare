let maxOrders = 3;

export const OrderHandler = {
    mealOptions: [],
    orders: [],
    completedOrders: [],
    failedOrders: [],
    orderCount: 0,

    init(mealOptions, serverComms, server) {
        this.mealOptions = mealOptions;
        this.serverComms = serverComms;
        this.orderCreationInterval(server);
    },

    orderCreationInterval(server) {
        // orderTimes should be defined in the level
        let orderTimes = [2000, 10000, 25000, 40000, 50000];
        setInterval(() => {
            let paused = server.paused;
            let timeLeft = server.timeLeft;
            let totalTime = server.level.timeSeconds;
            if (paused) return;
            let timePassed = (totalTime - timeLeft) * 1000;
            for (let i = 0; i < orderTimes.length; i++) {
                if (orderTimes[0] && orderTimes[0] <= timePassed) {
                    this.attemptAddingOrder();
                    orderTimes.shift();
                }
            }
        }, 1000);
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
            time: 22000,
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
        // this check is here because in multiplayer each client sends failed
        else if (!this.failedOrders.includes(order)) this.failedOrders.push(order);
        this.orders.splice(this.orders.indexOf(order), 1);
        // should take away time/score and give visual feedback
        if (this.orders.length == 0) {
            setTimeout(() => { this.generateOrder(); }, 2000);
        }
    }
}