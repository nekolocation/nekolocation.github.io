var buttonVariable = document.getElementById("toggleButton");
var sqr = document.getElementById("squirrel");
var track = 0;

var audio1 = new Audio('assets/audio/noise1.mp3');
var audio2 = new Audio('assets/audio/noise2.mp3');
var audio3 = new Audio('assets/audio/noise3.mp3');
var audio4 = new Audio('assets/audio/noise4.mp3');

function toggleTheme() {
    let bodyID = document.querySelector("html");
    bodyID.classList.toggle("light-mode-bg");
    sqr.classList.toggle("hueShift");
    if (track == 0) {
        track = 1;
        buttonVariable.style.backgroundImage="url(assets/img/eye_dark.png)";

    }
    else {
        track = 0;
        buttonVariable.style.backgroundImage="url(assets/img/eye_light.png)";
    }
}

function squirrelTag() {
    let rand = Math.random();
    // console.log(rand);
    if (rand < 0.25) {
        audio1.play();
    }
    else if (rand < 0.50) {
        audio2.play();
    }
    else if (rand < 0.75) {
        audio3.play();
    }
    else {
        audio4.play();
    }
}

buttonVariable.onclick = toggleTheme;
sqr.onclick = squirrelTag;