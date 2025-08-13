// this shit is from chatgpt atm
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("folder-select-input");
    const fileList = document.getElementById("file-list");

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
        fileList.innerHTML = "";

        // Show section header 
        document.getElementById("imported-files-header").style.display = "block";

        // Display each image
       imageFiles.forEach(file => {
            const url = URL.createObjectURL(file);

            const li = document.createElement("li");

            const wrapper = document.createElement("div"); // new wrapper inside <li>
            wrapper.style.display = "flex";
            wrapper.style.flexDirection = "row";
            wrapper.style.alignItems = "center";

            const img = document.createElement("img");
            img.src = url;
            img.alt = file.name;
            img.style.maxWidth = "20px";
            img.style.display = "block";

            const label = document.createElement("span");
            label.textContent = file.name;
            label.style.fontSize = "14px";
            label.style.marginLeft = "8px";

            wrapper.appendChild(img);
            wrapper.appendChild(label);
            li.appendChild(wrapper);
            fileList.appendChild(li);
            // todo: hover over thumbnail and see popup with full size? idk
        });

    }

    // wtf is this lmao
    function isImageFile(filename) {
        return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(filename);
    }
});
