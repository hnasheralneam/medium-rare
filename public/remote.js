import { gameCommsRemote } from "./engine/comms/GameCommsRemote.js";
import { createGame } from "./engine/game.js";
import { setGame } from "./state.js";

// setup game
const remoteGame = createGame(gameCommsRemote);
setGame(remoteGame);
