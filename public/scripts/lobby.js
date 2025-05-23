export let socket = io();
window.socket = socket;

// Join room
export let userInfo = JSON.parse(localStorage.getItem("userInfo"));
userInfo.location = "lobby";
window.isLeader = false;

if (typeof userInfo.nickname == "undefined") location.href = window.location.origin;


// Ensure that all user data is up-to-date

socket.emit("get socketid", userInfo.nickname);
socket.on("here is socketid", (socketid) => {
   let oldSocketId = userInfo.socketid;
   userInfo.socketid = socketid;
   localStorage.setItem("userInfo", JSON.stringify(userInfo));
   socket.emit("user data updated", userInfo, oldSocketId);

   if (userInfo.usertype == "leader") socket.emit("leaderConnectingToRoom", userInfo);
   else {
      document.querySelector(".waiting-text").textContent = "";
      socket.emit("player joining lobby", userInfo, userInfo.socketid);
   }
});

window.roomid = userInfo.roomname;

let gamecode;
socket.emit("get roomcode", userInfo.roomname);
socket.on("here is roomcode", (roomcode) => {
   gamecode = roomcode;
   document.querySelector(".roomcode-display").textContent = "Room Code: " + roomcode;
});
document.querySelector(".roomcode-display").addEventListener("click", () => {
   navigator.clipboard.writeText(gamecode);
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
            <button class="let-in-button">Let in</button>
            <button class="reject-button">Reject</button>
        `;
      listItem.id = "id-" + newUserInfo.socketid;
      listItem.querySelector(".let-in-button").onclick = () => { letIn(newUserInfo); }
      listItem.querySelector(".reject-button").onclick = () => {
         if (listItem) listItem.remove();
         reject(newUserInfo);
      }
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
function reject(newUser) {
   socket.emit("reject", newUser);
}

function kick(newUser) {
   socket.emit("kick", newUser);
}

function updateUsersList(users) {
   if (document.querySelector(".inRoom")) document.querySelector(".inRoom").innerHTML = "";
   else return;
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

// Latency test
let latency;
let sent = new Date();
socket.emit("test latency");

socket.on("latency tested", () => {
   let received = new Date();
   latency = received - sent;
   ("latency: " + latency / 1000);
});


// Lobby chat
function sendMessage(event) {
   event.preventDefault();
   let message = document.querySelector(".message-input").value;
   document.querySelector(".message-input").value = "";
   socket.emit("lobby chat message", { message: message, nickname: userInfo.nickname }, userInfo.roomname);
}

document.querySelector(".message-form").addEventListener("submit", sendMessage);

socket.on("lobby chat message", ({ message, nickname }) => {
   let messageEl = document.createElement("p");
   messageEl.textContent = `${nickname}: ${message}`;
   document.querySelector(".messages").append(messageEl);
});