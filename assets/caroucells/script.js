// this shit is from chatgpt atm
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("folder-select-input");
    const imageContainer = document.getElementById("imageContainer");

    input.addEventListener("change", handleFolderSelect);

    function handleFolderSelect(event) {
        const files = Array.from(event.target.files);

        // Filter image files (top-level folder only)
        const rootFolder = files[0]?.webkitRelativePath.split('/')[0] || "";
        const imageFiles = files.filter(file => {
            const path = file.webkitRelativePath;
            const depth = path.split('/').length;
            const isTopLevel = depth === 2; // e.g., FolderName/image.jpg
            return isTopLevel && isImageFile(file.name);
        });

        // Clear previous images
        imageContainer.innerHTML = "";

        // Display each image
        imageFiles.forEach(file => {
            const url = URL.createObjectURL(file);

            const wrapper = document.createElement("li");
            // wrapper.style.marginBottom = "10px";
            wrapper.style.display = "flex";
            wrapper.style.flexDirection = "row";

            const img = document.createElement("img");
            img.src = url;
            img.alt = file.name;
            img.style.maxWidth = "20px";
            img.style.display = "block";

            const label = document.createElement("span");
            label.textContent = file.name;
            label.style.display = "block";
            label.style.fontSize = "14px";
            label.style.marginTop = "4px";
            label.style.marginLeft = "8px";

            wrapper.appendChild(img);
            wrapper.appendChild(label);
            imageContainer.appendChild(wrapper);
            // todo: hover over thumbnail and see popup with full size? idk
        });
    }

    // wtf is this lmao
    function isImageFile(filename) {
        return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(filename);
    }
});
