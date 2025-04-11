import { Client } from "./client/client.js";
import { Server } from "./server/server.js";
import { LocalComm as LocalClientComm } from "./client/comm/local.js";
import { LocalComm as LocalServerComm } from "./server/comm/local.js";

const clientRef = { target: null };
const serverRef = { target: null };

const client = Client.create(null, LocalClientComm.create(serverRef));
clientRef.target = client;

const server = Server.create(LocalServerComm.create(clientRef));
serverRef.target = server;



// cluent