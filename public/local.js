import { gameCommsLocal } from "./engine/comms/GameCommsLocal.js";
import { serverCommsLocal } from "./engine/comms/ServerCommsLocal.js";
import { createGame } from "./engine/game.js";
import { createServer } from "./engine/server.mjs";
import { showAlerts, createAlert, hideAlerts } from "./alertSystem.js";
import { Game, setGame, setServer } from "./state.js";
import { SaveData } from "./storage.js";
import { DisplayController } from "./engine/displayController.js";

// setup game
const localGame = createGame(gameCommsLocal);
const localServer = createServer(serverCommsLocal)
setGame(localGame);
setServer(localServer);
localServer.getComms().giveServer(localServer);




Game.getComms().emitInit();

if (SaveData.firstTime) {
   showAlerts();
   createAlert("POV: You are Phil", undefined, true);
   createAlert("And the customers are angry", undefined, true);
   createAlert("The only way to save your beloved restaurant from angry customers is to make as many salads as possible within the time", undefined, true);
   createAlert("Pick up raw materials from the crates", undefined, true);
   createAlert("Slice them and combine to make salad", undefined, true);
   createAlert("Take a plate, put it on the counter, and put the salad on it", undefined, true);
   createAlert("Deliver it where it says to-go", undefined, true);
   createAlert("Player controls are in the settings (pause menu)", undefined, true);
   createAlert("Good luck!", undefined, true);
   hideAlerts(() => DisplayController.createPreGamePanel());
   SaveData.firstTime = false;
}
else DisplayController.createPreGamePanel();