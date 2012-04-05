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
var wordsToGuess = ["house", "box", "star", "rocket"];
var guessIndex = 0;

sock = socketio.listen(app);
sock.sockets.on("connection", function(socket) {
    console.log("Connection");
    if(players.length == 2) {
        socket.emit("full", {});
        return;
    }
    
    players[players.length] = {sock: socket};
    if(players.length == 2) {
        players[0].turn = "draw";
        players[1].turn = "guess";
        
        players[0].sock.emit('turn', {turn: "draw", word: wordsToGuess[guessIndex]});
        players[1].sock.emit('turn', {turn: "guess"});        
    }
    
    socket.on("draw", function(point) {
        socket.broadcast.emit("draw", point);
    });
    
    socket.on("guess", function(guess) {
        if(guess.word === wordsToGuess[guessIndex]) {
            guessIndex++;            
            for(var i=0;i<players.length;i++) {
                if(players[i].turn === "draw") {
                    players[i].turn = "guess";
                    players[i].sock.emit("turn",{turn: "guess"});
                }
                else {
                    players[i].turn = "draw";
                    players[i].sock.emit("turn",{turn: "draw", word: wordsToGuess[guessIndex]});                    
                }
            }
        }
    });
});

app.listen(8092);
