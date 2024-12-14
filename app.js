const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.static("assets"));

app.get("/", (req, res) => {
    res.render("index.html");
});

server.listen(port, () => {
    console.log("Started");
});
