let userInfo = JSON.parse(localStorage.getItem("userInfo"));
userInfo.location = "waiting room";

if (userInfo.nickname == "undefined") location.reload();

openModal("waiting");
document.querySelectorAll(".waiting-nickname").forEach(el => el.textContent = userInfo.nickname);

socket.emit("user data updated", userInfo);
socket.emit("player connecting to room", userInfo);


socket.on("you were let in", (roomname) => {
   location.href = window.location.origin + `/play?room=${roomname}`;
});
socket.on("you were rejected", () => {
   alert("Your attempt to join was rejected");
   location.reload();
});

socket.on("leader left lobby", () => {
   alert("Leader has left! You're being redirected.");
   location.reload();
});


setTimeout(() => {
   let leave = confirm("It's been a while. Want to leave?");
   if (leave) location.reload();
}, 120000);