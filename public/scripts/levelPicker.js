import { Game } from "../engine/game.js";

showLevelPicker();

async function showLevelPicker() {
    let levelPicker = document.querySelector(".level-picker-contents");
    levelPicker.classList.remove("hidden");

    for (const i in Game.levelNames) {
        let levelName = Game.levelNames[i];
        let level = await Game.getLevelData(levelName);
        let levelElement = document.createElement("div");
        levelElement.style.margin = "0 4rem";
        levelElement.classList.add("level-picker-element");
        levelElement.innerHTML = `
            <h3>${levelName}</h3>
            <p style="display: flex; align-items: center; justify-content: center">${getPeopleImages(level.minPlayers)}<span>&nbsp;-&nbsp;</span>${getPeopleImages(level.maxPlayers)}&nbsp;Players</p>
        `;
        function getPeopleImages(count) {
            let people = "";
            for (let i = 0; i < count; i++) {
                people += `<img src="sprites/player${Math.random() < .5 ? "2" : ""}/idle.png">`;
            }
            return people;
        }

        let button = document.createElement("button");
        button.textContent = "Play";
        button.addEventListener("click", () => {
            window.location.href = window.location.href + "play/" + levelName;
        });
        let imageParent = document.createElement("div");
        let image = document.createElement("img");
        image.src = `levels/${levelName}.png`;
        image.style.width = "100%";
        imageParent.style.display = "flex";
        imageParent.style.alignItems = "center";
        imageParent.style.justifyContent = "center";
        imageParent.style.margin = "1rem auto";
        imageParent.style.width = "15rem";
        imageParent.style.height = "15rem";
        imageParent.appendChild(image);
        levelElement.appendChild(button);
        levelElement.appendChild(document.createElement("br"));
        levelElement.appendChild(imageParent);
        levelPicker.appendChild(levelElement);
    }
}