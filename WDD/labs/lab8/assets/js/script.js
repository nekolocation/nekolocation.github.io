function toggleTheme() {
    let bodyID = document.querySelector("body");
    bodyID.classList.toggle("dark-mode");
}

let buttonVariable = document.getElementById("toggleButton");
buttonVariable.onclick = toggleTheme;