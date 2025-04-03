const express = require("express");
const app = express();
const http = require("http");
const ejs = require("ejs");
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.static("assets"));
app.use("/scripts", express.static(__dirname + "/public/scripts/"));
app.use("/item/", express.static(__dirname + "/assets/items"));
app.set("view engine", "ejs");

app.get("/", (_req, res) => {
    res.render("home");
});

app.get("/play/:level", (req, res) => {
    console.log(req.params.level)
    res.render("game", {
        level: req.params.level
    });
});

server.listen(port, () => {
    console.log("Medium Rare active on port " + port);
});
