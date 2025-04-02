const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.static("assets"));
app.set("view engine", "ejs");

app.get("/", (_req, res) => {
    res.render("home.html");
});

app.get("/play/:level", (req, res) => {
    res.render("game.html", {
        level: req.params.level
    });
});

server.listen(port, () => {
    console.log("Started on port " + port);
});
