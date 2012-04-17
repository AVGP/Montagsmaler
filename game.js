var context = null;
var sock = null;
var pathPoints = [];
var isPainting = false;
var myTurn = null;
var wordToDraw = "";

$(document).ready(function() {
    convertTouchToMouse("canvas");
	context = document.getElementById("canvas").getContext("2d");
    
    $("#dialog").dialog({modal: true, autoOpen: false, width: "80%"});
    
    
    //
    // Socket fun
    //
    
    $("#status").html("Connecting...").addClass("info");
    sock = io.connect();
    sock.on("connect", function(data) {
        $("#game").show();
        $("#status").html("Waiting for other player..").removeClass("error").addClass("info");
    });

    sock.on("turn", function(data) {
        myTurn = data.turn;
        var tmpImage = $("#canvas")[0].toDataURL();
        pathPoints = [];
        redraw();
        
        if(data.turn === "draw") {
            $("#guessform").fadeOut();
            $("#skip, #reset, #save").fadeIn();
            $("#status").fadeOut().html("You need to draw \"" + data.word + "\"").removeClass("error").addClass("info").delay(800).slideDown();
            wordToDraw = data.word;
        } else if(data.turn === "guess") {
            if(wordToDraw !== "") {
                $("#dialog").html("<p>The other player guessed the word.</p><p>If you want, you can save the image now.</p>")
                    .dialog("option", "buttons", {
                        "save & share image": function() {
                            sock.emit("save", {
                                imgData: tmpImage, 
                                name: wordToDraw + "_" + Date.parse(new Date().toGMTString())
                            });
                        },
                        "continue": function() {
                            $(this).dialog("close");
                        }
                    })
                    .dialog("open");
            }
            
            $("#guessform").fadeIn();
            $("#skip, #reset, #save").fadeOut();
            $("#status").html("You need to guess").removeClass("error").addClass("info").fadeOut().delay(800).slideDown();
        }
    });
    
    sock.on("draw", function(point) {
        if(myTurn === "draw") return; //when we're drawing, we should disregard "enemy" input
        pathPoints.push(point);
        redraw();
    });
        
    sock.on("reset", function() {
        pathPoints = [];
        redraw();
    });
    
    sock.on("guess", function(guess) {
        $("#status").html("The other player guessed \"" + guess.word + "\"").removeClass("error").addClass("info").fadeOut().delay(800).slideDown();        
    });
    
    sock.on("disconnect", function() {
        sock.disconnect();
        $("#status").html("The other player is disconnected. Reload the page.").removeClass("info").addClass("error").fadeOut().delay(800).slideDown();
        $("#game").hide();
    });
    
    sock.on("saved", function(data) {
        var url = "/me/fbmontagsmaler:draw?word=" + encodeURIComponent("http://montagsmaler.nodester.com/image.html?img=" + data.img);
        console.log("D:");
        console.log(url);
        FB.api(
            url,
            'post',
            function(response) {
                if (!response || response.error) {
                    console.log(response.error);
                } else {
                }
        });
        $("#dialog").html("<p>Your image is available at <a href=\"image.html?img=" + data.img + "\" target=\"_blank\">" + document.location.href + "image.html?img=" + data.img + "</a>.</p>")
        .dialog("buttons", {}).dialog("open");
    });
    
    
    //
    // Mouse events
    //
    
    $("#canvas").mousedown(function(e) {
        if(myTurn !== "draw" || isPainting === true) return;
        isPainting = true;
        addPathPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    });
    
    $("#canvas").mousemove(function(e) {
        if(myTurn !== "draw") return;
        if(isPainting) {
            if(e.pageX - this.offsetLeft == 251 && e.pageY - this.offsetTop == 251) return; //Ugly bug.
            addPathPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
            redraw();
        }
    });
    
    $("#canvas").mouseup(function() {
        isPainting = false; 
    });
        
    $("#skip").click(function() {
        if(myTurn !== "draw") return;
        sock.emit("skip", {msg: "Wer das liest is doof."});
    });
    
    $("#reset").click(function() {
        if(myTurn !== "draw") return;
        sock.emit("reset", { msg: "Nich gucken!"});
        pathPoints = [];
        redraw();
    });
    
    $("#save").click(function() {
        sock.emit("save", {
            imgData: $("#canvas")[0].toDataURL(), 
            name: wordToDraw + "_" + Date.parse(new Date().toGMTString())
        });
    });
    
    //
    // Keyboard event
    //
    
    $("#guessform").submit(function() {
        if(myTurn !== "guess") return;
        sock.emit("guess", { word: $("#guess").val()});
        $("#guess").val("");
    });
    
    
    //
    // Drawing related
    //
    
    function addPathPoint(x,y, restart) {
        var point = {
            "x": x, 
            "y": y,
            "restart": restart
        };
        
        sock.emit("draw", point);
        
        pathPoints.push(point);
    }
    
    function redraw() {
        context.clearRect(0, 0, 500, 500);
        context.fillStyle   = "#fff";
        context.strokeStyle = "#000";
        context.lineJoin    = "round";
        context.lineWidth   = 2;

        context.fillRect(0, 0, 500, 500);
        
        for(var i=0;i<pathPoints.length-1;i++) {
            context.beginPath();
            context.moveTo(pathPoints[i].x, pathPoints[i].y);
            if(!pathPoints[i+1].restart)
                context.lineTo(pathPoints[i+1].x, pathPoints[i+1].y);
            context.closePath();
            context.stroke();
        }
    }
});
