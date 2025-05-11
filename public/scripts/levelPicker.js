import { getOtherLevelData } from "../levelDataParser.js";

let levelNames = ["square", "wide", "huge"];

showLevelPicker();

async function showLevelPicker() {
    let levelPicker = document.querySelector(".level-picker-contents");

    for (const i in levelNames) {
        let levelName = levelNames[i];
        let level = await getOtherLevelData(levelName);
        let levelElement = document.createElement("div");
        levelElement.classList.add("level-picker-element");
        levelElement.innerHTML = `
            <h3>${levelName}</h3>
            <p class="people-container">${getPeopleImages(level.minPlayers)}<span>&nbsp;-&nbsp;</span>${getPeopleImages(level.maxPlayers)}&nbsp;Players</p>
        `;
        function getPeopleImages(count) {
            let people = "";
            for (let i = 0; i < count; i++) {
                people += `<img src="sprites/old/${randomSprite()}.png" style="transition: .05s" onmouseover="this.style.transform = 'rotate(${(Math.random() * 360)}deg)'" onmouseout="this.style.transform = 'rotate(0deg)'">`;
            }
            return people;
            function randomSprite() {
                let sprites = ["phil", "bill", "frill", "still", "jill"];
                return sprites[Math.floor(Math.random() * sprites.length)];
            }
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
        imageParent.classList.add("image-container");
        imageParent.appendChild(image);
        levelElement.appendChild(button);
        levelElement.appendChild(document.createElement("br"));
        levelElement.appendChild(imageParent);
        levelPicker.appendChild(levelElement);
    }
}