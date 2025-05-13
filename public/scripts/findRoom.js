openModal("find");
socket.emit("find room", socket.id);

let roomsElement = document.querySelector(".open-rooms");
let rooms = [];
socket.on("have open rooms", (newRooms) => {
   rooms = newRooms;
   redrawRooms();
});

socket.on("room added", (room) => {
   rooms.push(room);
   redrawRooms();
});

socket.on("room removed", (roomid) => {
   rooms = rooms.filter(room => room.info.name != roomid);
   redrawRooms();
});

function redrawRooms() {
   roomsElement.innerHTML = "";
   for (const room of rooms) {
      let roomElement = document.createElement("div");
      roomElement.classList.add("room");
      roomElement.innerHTML = `
         <p>Room: ${room.info.code}</p>
         <p>Leader: ${room.users.find(user => user.usertype == "leader").nickname}</p>
         <button>Join</button>
      `;
      roomElement.querySelector("button").addEventListener("click", () => {
         socket.emit("join room", room.info.code);
      });
      roomsElement.appendChild(roomElement);
   }
}

(() => {
   let searchingForRoomsLabel = document.querySelector(".searching-for-rooms").querySelector(".ellipsis");
   let periods = ".";
   setInterval(() => {
      periods += ".";
      if (periods.length > 4) periods = ".";
      searchingForRoomsLabel.textContent = periods;
   }, 1000);
})();