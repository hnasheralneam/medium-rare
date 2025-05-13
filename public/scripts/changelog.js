let changelog = {
   "v0.2.5": [
      "add finding public multiplayer rooms",
      "add setting room to public or private when creating",
      "add changelog on homescreen",
      "improve multiplayer handling of players",
      "fix orders being generated while paused",
      "fix food being cut while paused",
      "fix wrong amount of failed orders in multiplayer games",
      "add button to exit waiting room",
      "add button for leader to remove players from waiting room"
   ],
   "v0.2.4": [
      "add changing player sprites pregame",
      "add related links (feedback, discord, github)",
      "mobile fullscreens consistently (for portrait and landscape)",
      "better mobile pregame screen",
      "add qr code to readme"
   ],
   "v0.2.3": [
      "zoom in/out of level by scrolling",
      "add dark theme for game",
      "mobile and other theme improvements",
      "fix gamepad player choppiness",
      "set movement cooldown for player",
      "fix players able to join waiting room after game start"
   ],
   "v0.2.2": [
      "fix orders started on game init rather than start",
      "fix broken favicon",
      "fix game starting multiple times creating double player movement",
      "fix mulitplayer chat",
      "improve multiplayer lobby styles"
   ],
   "v0.2.1": [
      "fix production crashes",
      "fix can't add touch player after removing it",
      "fix game starting multiple times creating double player movement"
   ],
   "v0.2.0": [
      "minor refactoring",
      "full-feature multiplayer",
      "return empty plates to plateplace",
      "fix local play trailing slash issue",
      "add new character, jill"
   ]
}

function generateChangelogHTML(changelog) {
   let html = "";
   for (const version in changelog) {
      html += `<div><h2>${version}${version == Object.keys(changelog)[0] ? " (current)" : ""}</h2><ul>`;
      for (const change of changelog[version]) {
         html += `<li>${change}</li>`;
      }
      html += `</ul></div>`;
   }
   return html;
}

let changelogHTML = generateChangelogHTML(changelog);

document.querySelector(".changelog-elements").outerHTML = changelogHTML;