let socket = io();

// Join room
let userInfo = JSON.parse(localStorage.getItem("userInfo"));
userInfo.location = "lobby";

if (typeof userInfo.nickname == "undefined") location.href = window.location.origin;


// Ensure that all user data is up-to-date

socket.emit("get socketid", userInfo.nickname);
socket.on("here is socketid", (socketid) => {
   let oldSocketId = userInfo.socketid;
   userInfo.socketid = socketid;
   localStorage.setItem("userInfo", JSON.stringify(userInfo));
   socket.emit("user data updated", userInfo, oldSocketId);

   if (userInfo.usertype == "leader") socket.emit("leader connecting to room", userInfo);
   else {
      document.querySelector(".waiting-text").textContent = "";
      socket.emit("player joining lobby", userInfo, userInfo.socketid);
   }
});

// for all multiplayer games gameid must exist
window.gameid = userInfo.roomname;

socket.emit("get roomcode", userInfo.roomname);
socket.on("here is roomcode", (roomcode) => {
   document.querySelector(".roomcode-display").textContent = "Room Code: " + roomcode;
});




// Leader only
socket.on("user in waiting room left", (departingUserSocketId) => {
   let userEl = document.querySelector("#id-" + departingUserSocketId);
   if (userEl) userEl.remove();
});

socket.on("someone in waiting room", (newUserInfo) => {
   if (userInfo.usertype == "leader") {
      let listItem = document.createElement("LI");
      listItem.innerHTML = `
            <p>${newUserInfo.nickname}<p>
            <button>Let in</button>
        `;
      listItem.id = "id-" + newUserInfo.socketid;
      listItem.querySelector("button").onclick = () => { letIn(newUserInfo); }
      document.querySelector(".waiting").append(listItem);
   }
});


// All user events
socket.on("you were kicked out", () => {
   location.href = window.location.origin;
});

socket.on("users in lobby updated", (usersList) => {
   updateUsersList(usersList);
});

socket.on("leader left lobby", goHome);
socket.on("room closed", goHome);

function goHome() {
   alert("Leader has left/room was closed! Sorry, you're being redirected.");
   location.href = window.location.origin;
}


function letIn(newUser) {
   socket.emit("let in", newUser);
}

function kick(newUser) {
   socket.emit("kick", newUser);
}

function updateUsersList(users) {
   document.querySelector(".inRoom").innerHTML = "";
   users.forEach((user) => {
      let listItem = document.createElement("LI");
      listItem.innerHTML = `
            <p>${user.nickname}<p>
            <button>Kick</button>
        `;
      listItem.querySelector("button").onclick = () => { kick(user); }
      if ((userInfo.usertype == "player") || (user.usertype == "leader"))
         listItem.innerHTML = `<p>${user.nickname} ${userInfo.nickname == user.nickname ? "(you)" : ""}<p>`;
      document.querySelector(".inRoom").append(listItem);
   });
}

// Add start button for leader
function leaderStart() {
   window.levelName = document.querySelector(".level-select-dropdown").value;
   document.querySelector(".multiplayer-lobby").remove();
   window.startGame(window.levelName);
}
if (userInfo.usertype == "leader") {
   document.querySelector(".leader-options").classList.remove("hidden");
}

// Latency test

let latency;
let sent = new Date();
socket.emit("test latency");

socket.on("latency tested", () => {
   let received = new Date();
   latency = received - sent;
   console.log("latency: " + latency / 1000);
});


// Lobby chat - html is this
function sendMessage(event) {
   event.preventDefault();
   let message = document.querySelector(".message-input").value;
   document.querySelector(".message-input").value = "";
   socket.emit("lobby chat message", { message: message, nickname: userInfo.nickname }, userInfo.roomname);
}

socket.on("lobby chat message", ({ message, nickname }) => {
   let messageEl = document.createElement("p");
   messageEl.textContent = `${nickname}: ${message}`;
   document.querySelector(".messages").append(messageEl);
});