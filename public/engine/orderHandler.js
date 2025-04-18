import { RecipeList, findRecipe } from "./item.js";
import { Game } from "./game.js";

let maxOrders = 3;

export class OrderHandler {
    mealOptions = [];
    orders = [];
    completedOrders = [];
    failedOrders = [];

    constructor(mealOptions) {
        this.mealOptions = mealOptions;
        // speed of order generation should be defined in the level
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
            return false;
        }
    }

    generateOrder() {
        let meal = this.mealOptions[Math.floor(Math.random() * this.mealOptions.length)];
        let newOrder = new Order(meal, 25000, this);
        this.orders.push(newOrder);
    }

    submitOrder(player) {
        if (player.item === null || player.item.name() != "plate") return;
        if (this.mealOptions.includes(player.item.getItems()[0].name())) {
            let order = this.orders.find(o => o.name == player.item.getItems()[0].name());
            if (order) {
                order.element.remove();
                order.finish();
                this.orders.splice(this.orders.indexOf(order), 1);
                this.completedOrders.push(order);
                Game.stats.score++;
                player.deleteItem();
                if (this.orders.length == 0) {
                    setTimeout(() => { this.generateOrder(); }, 2000);
                }
            }
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
            element.src = `../items/${ingredient}.png`;
            ingredientList.appendChild(element);
        }
        orderElement.appendChild(ingredientList);

        let foodImage = document.createElement("img");
        foodImage.classList.add("image");
        foodImage.src = `../items/${this.name}.png`;
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
        this.countdownInterval = setInterval(() => {
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
                    clearInterval(this.countdownInterval);
                    if (this.handler.orders.length == 0) {
                        setTimeout(() => { this.handler.generateOrder(); }, 2000);
                    }
                }
            }
        }, interval);
    }

    finish() {
        clearInterval(this.countdownInterval);
    }
}