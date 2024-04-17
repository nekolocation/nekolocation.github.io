let songsSecondHalf = document.getElementById("songs-second-half");
let buttonID = document.getElementById("toggle-button");

songsSecondHalf.classList.add("hidden");

function toggleSongs() {
    songsSecondHalf.classList.toggle("hidden");
    if (buttonID.innerHTML == "Show more songs") {
        buttonID.innerHTML = "Show less songs"
    }
    else {
        buttonID.innerHTML = "Show more songs"
    }

}

document.getElementById("toggle-button").onclick = toggleSongs;