let userInfo = JSON.parse(localStorage.getItem("userInfo"));
userInfo.location = "waiting room";

if (userInfo.nickname == "undefined") location.reload();

document.querySelector(".waiting-room").classList.remove("hidden");
document.querySelector(".waiting-nickname").textContent = userInfo.nickname;

socket.emit("user data updated", userInfo);
socket.emit("player connecting to room", userInfo);


socket.on("you were let in", (roomname) => {
   location.href = window.location.origin + `/play?room=${roomname}`;
});

socket.on("leader left lobby", () => {
   alert("Leader has left! You're being redirected.");
   location.reload();
});
