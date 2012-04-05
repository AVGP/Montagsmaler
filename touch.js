// See http://vetruvet.blogspot.de/2010/12/converting-single-touch-events-to-mouse.html - thanks to his blog post this could be done in the blink of an eye
function convertTouchToMouse(id) {
    element = document.getElementById(id);
    var touchToMouse=function(b){var a=b.changedTouches[0],c="";switch(b.type){case "touchstart":c="mousedown";break;case "touchmove":c="mousemove";break;case "touchend":c="mouseup";break;default:return}var d=document.createEvent("MouseEvent");d.initMouseEvent(c,true,true,window,1,a.screenX,a.screenY,a.clientX,a.clientY,false,false,false,false,0,null);a.target.dispatchEvent(d);b.preventDefault()};
    element.ontouchstart=touchToMouse;
    element.ontouchmove=touchToMouse;
    element.ontouchend=touchToMouse; 
}
