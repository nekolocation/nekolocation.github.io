var buttonVariable = document.getElementById("toggleButton");
var sqr = document.getElementById("squirrel");
var track = 0;

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

buttonVariable.onclick = toggleTheme;