var context = null;
var sock = null;
var pathPoints = [];
var isPainting = false;

$(document).ready(function() {
	context = document.getElementById("canvas").getContext("2d");
    
    
    //
    // Socket fun
    //
    
    $("#status").html("Connecting...");
    sock = io.connect();
    sock.on("connect", function(data) {
        $("#status").html("Waiting for other player..");
    });

    sock.on("hello", function(data) {
        if(data.turn === "draw") $("#status").html("You need to draw");
        else if(data.turn === "guess") $("#status").html("You need to guess");
    });
    
    sock.on("draw", function(point) {
        pathPoints.push(point);
        redraw();
    });
    
    
    //
    // Mouse events
    //
    
    $("#canvas").mousedown(function(e) {
        isPainting = true;
        addPathPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    });
    
    $("#canvas").mousemove(function(e) {
        if(isPainting) {
            addPathPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
            redraw();
        }
    });
    
    $("#canvas").mouseup(function() { isPainting = false; });

    
    //
    // Touch events
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
        context.strokeStyle = "#000";
        context.lineJoin    = "round";
        context.lineWidth   = 2;
        
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
