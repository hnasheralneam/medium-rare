import { findRecipe } from "./item.js";
import { DisplayController } from "./displayController.js";
import { Game } from "../state.js";

export class Order {
   constructor({ name, time, number }) {
      this.name = name;
      this.time = time;
      this.timeLeft = time;
      this.number = number;

      this.createOrderElement();
      this.startCountdown();
   }

   createOrderElement() {
      let orderElement = document.createElement("div");
      orderElement.classList.add("order");
      orderElement.classList.add("order-" + this.number);
      orderElement.innerHTML = `
            <h2 class="name">${this.name}</h2>
            <span class="number">#${this.number}</span>
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
      orderElement.addEventListener("dblclick", () => {
         this.finish();
      })
      DisplayController.addOrderElement(orderElement);
      this.element = orderElement;
   }

   startCountdown() {
      let interval = 250;
      this.countdownInterval = setInterval(() => {
         if (Game.getComms().isPaused()) return;
         this.timeLeft -= interval;
         let percent = (this.timeLeft / this.time) * 100;
         this.element.querySelector(".time-left-progress").style.width = `${percent}%`;
         if (percent <= 30) {
            this.element.querySelector(".time-left-progress").style.backgroundColor = "red";
         }
         if (this.timeLeft <= 0) {
            this.element.remove();
            Game.getComms().emitFailOrder(this.number);
            clearInterval(this.countdownInterval);
         }
      }, interval);
   }

   finish() {
      clearInterval(this.countdownInterval);
   }
}