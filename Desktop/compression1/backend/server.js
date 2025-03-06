function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    fetch("https://compressionapp.onrender.com/upload", {
        method: "POST",
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.path) {
            const downloadLink = document.getElementById("downloadLink");
            downloadLink.href = data.path;
            downloadLink.download = "compressed-image.webp";
            downloadLink.style.display = "block";
            
            document.getElementById("compressedSize").textContent = (data.compressedSize / 1024).toFixed(2) + " KB";
            document.getElementById("sizeReduction").textContent = data.lossPercentage + "%";

            // ✅ Now set the compressed image & calculate SSIM
            const compressedImg = document.getElementById("compressedImage");
            compressedImg.src = data.path;

            compressedImg.onload = () => {
                setTimeout(calculateSSIM, 500); // Ensure the image is fully loaded before SSIM calculation
            };
        } else {
            console.error("Upload failed:", data.error);
        }
    })
    .catch(error => {
        console.error("Upload error:", error);
    });
}
