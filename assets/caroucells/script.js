let folderHandle = null;
let imageHandles = [];

document.getElementById("openBtn").addEventListener("click", openFolder);

async function openFolder() {
    try {
        // Prompt user to select a folder
        folderHandle = await window.showDirectoryPicker();
        imageHandles = [];

        // Read all entries in the folder
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file' && isImageFile(entry.name)) {
                imageHandles.push(entry);
            }
        }

        // Display images
        displayImages();
    } catch (err) {
        console.error("User cancelled or error occurred:", err);
    }
}

function isImageFile(filename) {
    return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(filename);
}

async function displayImages() {
    const container = document.getElementById("imageContainer");
    container.innerHTML = ''; // Clear old images

    for (const handle of imageHandles) {
        const file = await handle.getFile();
        const url = URL.createObjectURL(file);

        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        img.style.maxWidth = "200px";
        img.style.margin = "10px";

        container.appendChild(img);
    }
}
