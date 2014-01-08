var socketio = require("socket.io");
var fs = require("fs");
var url = require("url");
var port = process.env.PORT || 8092;

var app = require("http").createServer(function(req, resp) {
    var urlobj = url.parse(req.url, true);
    var path = urlobj.pathname;
    if(path == "/") path = "/index.html";
    console.log("Path "+path+" requested.");
    
    if(path == "/image.html") {
        console.log(urlobj.query);
        var imgName = urlobj.query["img"];
        resp.writeHead(200,"Content-Type: text/html");
        resp.write(deliverDrawingImage(imgName));
        resp.end();
        return;
    }
    
    fs.readFile( __dirname + path, function(error, data) {
        if(error) {
            resp.writeHead(404);
            resp.end();
            return;
        }
        
        contentType = "text/html";
        if(path.match(/\.js$/) !== null) contentType = "text/javascript";
        else if(path.match(/\.png$/) !== null) contentType = "image/png";
        
        resp.writeHead(200, "Content-Type:"+ contentType);
        resp.write(data);
        resp.end();
    });
});

function deliverDrawingImage(img) {
    var imgName = img;
    try {
        var word = imgName.match(/^(\w+)_/)[1];
        var content = fs.readFileSync(__dirname + "/image.html").toString();
    
        content = content.replace(/\{\{imgName\}\}/g, imgName);
        content = content.replace(/\{\{word\}\}/g, word);
        return content;
    } catch(e) {
        return "";
    }
}

var players = [];
var wordsToGuess = fs.readFileSync(__dirname + "/words.txt").toString().split("\n");
console.log("Game ready. (Listening on " + port + ")");
var guessIndex = Math.round(Math.random() * (wordsToGuess.length-1));

sock = socketio.listen(app);
sock.sockets.on("connection", function(socket) {
    players[players.length] = {sock: socket};
    if(players.length == 2) {
        startGame(players);
        players = [];
    }
});

app.listen(port, process.env.IP);

function startGame(p_participants) {
    var participants = p_participants;
    participants[0].turn = "draw";
    participants[1].turn = "guess";
        
    participants[0].sock.emit('turn', {turn: "draw", word: wordsToGuess[guessIndex]});
    participants[1].sock.emit('turn', {turn: "guess"});        
    
    for(var pIndex=0;pIndex < participants.length;pIndex++) {
        participants[pIndex].sock.on("draw", function(point) {
            this.broadcast.emit("draw", point);
        });
    
        participants[pIndex].sock.on("guess", function(guess) {
            if(guess.word === wordsToGuess[guessIndex]) {
                guessIndex = Math.round(Math.random() * (wordsToGuess.length-1))
                for(var i=0;i<participants.length;i++) {
                    if(participants[i].turn === "draw") {
                        participants[i].turn = "guess";
                        participants[i].sock.emit("turn",{turn: "guess"});
                    }
                    else {
                        participants[i].turn = "draw";
                        participants[i].sock.emit("turn",{turn: "draw", word: wordsToGuess[guessIndex]});                    
                    }
                }
            }
            else {
                this.broadcast.emit("guess", guess);
            }
        });
    
        participants[pIndex].sock.on("skip", function() {
            guessIndex = Math.round(Math.random() * (wordsToGuess.length-1))
            this.emit("turn", {turn: "draw", word: wordsToGuess[guessIndex]});
        });
        
        participants[pIndex].sock.on("reset", function() {
            this.broadcast.emit("reset");
        });

        participants[pIndex].sock.on("save", function(data) {
            var img = data.imgData;
            img = img.replace(/^data:image\/\w+;base64,/, "");
            var buffer = new Buffer(img, "base64");
            fs.writeFileSync(__dirname + "/img_" + data.name + ".png", buffer);
            this.emit("saved", {img: data.name});
        });
        
        participants[pIndex].sock.on("disconnect", function() { this.broadcast.emit("disconnect"); });
    }
}
