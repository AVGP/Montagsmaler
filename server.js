var socketio = require("socket.io");
var fs = require("fs");
var url = require("url");

var app = require("http").createServer(function(req, resp) {
    var path = url.parse(req.url).pathname;
    if(path == "/") path = "/index.html";
    console.log("Path "+path+" requested.");
    fs.readFile( __dirname + path, function(error, data) {
        if(error) {
            resp.writeHead(404);
            resp.end();
            return;
        }
        
        contentType = "text/html";
        if(path.match(/\.js$/) !== null) contentType = "text/javascript";
        
        resp.writeHead(200, "Content-Type:"+ contentType);
        resp.write(data);
        resp.end();
    });
});

var players = [];

sock = socketio.listen(app);
sock.sockets.on("connection", function(socket) {
    console.log("Connection");
    if(players.length == 2) {
        socket.emit("full", {});
        return;
    }
    
    players[players.length] = socket;
    if(players.length == 2) {
        players[0].emit('hello', {turn: "draw"});
        players[1].emit('hello', {turn: "guess"});        
    }
    
    socket.on("draw", function(point) {
        socket.broadcast.emit("draw", point);
    });
});

app.listen(8092);
