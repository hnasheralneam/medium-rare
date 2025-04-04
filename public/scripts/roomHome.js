let socket = io();

localStorage.setItem("userInfo", JSON.stringify({}));

function openModal(name) {
   let modal = document.querySelector(`.${name}-room`);
   if (modal.style.opacity == 1) {
      modal.style.opacity = 0;
      modal.style.pointerEvents = "none";
   }
   else {
      modal.style.opacity = 1;
      modal.style.pointerEvents = "auto";
   }
}

let nickname;

function joinRoom(event) {
   event.preventDefault();
   if (setNickname(".join-form")) return;
   roomcode = document.querySelector(".join-form").querySelector(".roomcode").value;
   socket.emit("join room", roomcode);
}

function createRoom(event) {
   event.preventDefault();
   if (setNickname(".create-form")) return;
   socket.emit("create room", nickname);
}

function setNickname(form) {
   nickname = document.querySelector(form).querySelector(".nickname").value;
   if (nickname.length > 20) {
      alert("NiCkNaMe tOo LoNg");
      return true;
   }
   if (containsNonAlpha(nickname)) {
      alert("NiCkNaMe cAn OnLy CoNtAiN lEtTeRs");
      return true;
   }
   return false;

   function containsNonAlpha(string) {
      let regex = /[^a-zA-Z]/;
      return regex.test(string);
   }
}

socket.on("room created", (data) => {
   localStorage.setItem("userInfo", JSON.stringify({
      nickname: nickname,
      socketid: data.socketid,
      roomname: data.roomname,
      usertype: data.usertype,
      location: "home"
   }));
   location.href = location.href + `play?room=${data.roomname}`;
});

socket.on("joined room", (data) => {
   localStorage.setItem("userInfo", JSON.stringify({
      nickname: nickname,
      socketid: data.socketid,
      roomname: data.roomname,
      usertype: data.usertype,
      location: "home"
      // pos added later
   }));

   attachScript("scripts/waitingRoom.js");
});

socket.on("no such room", (errorMessage) => {
   document.querySelector(".error-place").textContent = errorMessage;
});