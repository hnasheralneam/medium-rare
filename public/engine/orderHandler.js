class OrderHandler {
    constructor(mealOptions) {
        this.mealOptions = mealOptions;
        this.orders = []
    }

    generateOrder() {
        let meal = mealOptions[Math.floor(Math.random() * mealOptions.length)];
        const order = {
            name: meal.name,
            time: 15000,
            timeLeft: 15000
        }
        this.orders.push(order);
        this.countDown(this.orders.length)
    }

    countDown(orderIndex) {
        let orderTimeLeft = this.orders[orderIndex].timeLeft;
        while (orderTimeLeft > 0) {
            orderTimeLeft -= 1000
            setTimeout(() => {
                this.countDown(orderIndex)
            }, 1000);
        }
    }
}

/*
MEAL FORMAT
{
    name: "salad"
    ingredients: ["lettuce", "tomatoes"] // must be sliced, isReady (property on raw food) = true
}

*/