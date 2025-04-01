import { RecipeList, findRecipe } from "./item.js";
import { Game } from "./game.js";

let maxOrders = 3;

export class OrderHandler {
    mealOptions = [];
    orders = [];
    completedOrders = [];
    failedOrders = [];
    waitingOrders = 0;

    constructor(mealOptions) {
        this.mealOptions = mealOptions;
        // speed of order generation should be based on each level
        // handle max
        // have a waitlist for stuff over the max, add as soon as one is finished/completed
        // consider using an array of times instead
        setTimeout(() => { this.attemptAddingOrder(); }, 2000);
        setTimeout(() => { this.attemptAddingOrder(); }, 10000);
        setTimeout(() => { this.attemptAddingOrder(); }, 25000);
        setTimeout(() => { this.attemptAddingOrder(); }, 40000);
        setTimeout(() => { this.attemptAddingOrder(); }, 50000);
    }

    attemptAddingOrder() {
        if (this.orders.length < maxOrders) {
            this.generateOrder();
            return true;
        }
        else {
            // push to waitlist
            return false;
        }
    }

    generateOrder() {
        let meal = this.mealOptions[Math.floor(Math.random() * this.mealOptions.length)];
        let newOrder = new Order(meal, 25000, this);
        this.orders.push(newOrder);
    }

    submitOrder(player) {
        // later make sure that it has a plate
        if (player.item === null) return;
        // should be fixed
        // not giving this error, but there are still times the playre cannot submit a food <-- still a problem (but it might only be from the left side of delivery)
        if (this.mealOptions.includes(player.item.name())) {
            let order = this.orders.find(o => o.name == player.item.name());
            if (order) {
                order.element.remove();
                this.orders.splice(this.orders.indexOf(order), 1);
                this.completedOrders.push(order);
                Game.stats.score++;
                player.deleteItem();
                if (this.orders.length == 0) {
                    setTimeout(() => { this.generateOrder(); }, 2000);
                }
            }
        }
        else {
            console.log("wrong food:" + player.item.name() + " : "  + this.mealOptions)
        }
    }
}

class Order {
    constructor(name, time, handler) {
        this.handler = handler;
        this.name = name;
        this.time = time;
        this.timeLeft = time;

        this.createOrderElement();
        this.countDown();
    }

    createOrderElement() {
        let orderElement = document.createElement("div");
        orderElement.classList.add("order");
        orderElement.innerHTML = `
            <h2 class="name">${this.name}</h2>
        `;
        let ingredientList = document.createElement("div");
        ingredientList.classList.add("ingredients");

        let ingredientNames = findRecipe(this.name).items;
        for (let ingredient of ingredientNames) {
            let element = document.createElement("img");
            element.classList.add("ingredient");
            element.src = `items/${ingredient}.png`;
            ingredientList.appendChild(element);
        }
        orderElement.appendChild(ingredientList);
        // add plate image behind later
        let foodImage = document.createElement("img");
        foodImage.classList.add("image");
        foodImage.src = `items/${this.name}.png`;
        orderElement.appendChild(foodImage);
        let timeLeft = document.createElement("div");
        timeLeft.classList.add("time-left");
        let timeLeftProgress = document.createElement("div");
        timeLeftProgress.classList.add("time-left-progress");
        timeLeftProgress.style.width = "0%";
        timeLeft.appendChild(timeLeftProgress);
        orderElement.appendChild(timeLeft);
        document.querySelector(".orders").appendChild(orderElement);
        this.element = orderElement;
    }

    countDown() {
        let interval = 250;
        if (!Game.paused) {
            this.timeLeft -= interval;
            let percent = (this.timeLeft / this.time) * 100;
            this.element.querySelector(".time-left-progress").style.width = `${percent}%`;
            if (percent <= 30) {
                this.element.querySelector(".time-left-progress").style.backgroundColor = "red";
            }
            if (this.timeLeft <= 0) {
                this.element.remove();
                this.handler.failedOrders.push(this);
                this.handler.orders.splice(this.handler.orders.indexOf(this), 1);
                // consider making a beep/bad noise, and good noise for submitted
                // take away time/score and give visual feedback for that
                return;
            }
        }
        setTimeout(() => {
            this.countDown();
        }, interval);
    }
}