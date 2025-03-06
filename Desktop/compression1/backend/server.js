const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { ssim } = require("image-ssim");

const app = express();

app.use(cors({
    origin: "https://compression1.vercel.app", // Replace with your frontend URL
    methods: "GET,POST",
    allowedHeaders: "Content-Type"
}));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const originalPath = req.file.path;
    const compressedPath = path.join(uploadDir, `compressed-${Date.now()}.webp`);

    try {
        // Compress image with Sharp
        await sharp(originalPath)
            .resize({ width: 800 })
            .webp({ quality: 70 }) // Modify based on frontend slider
            .toFile(compressedPath);

        // Calculate File Sizes
        const originalSize = fs.statSync(originalPath).size;
        const compressedSize = fs.statSync(compressedPath).size;
        const sizeReduction = ((1 - (compressedSize / originalSize)) * 100).toFixed(2);

        // Convert to Buffers for SSIM Calculation
        const originalBuffer = await sharp(originalPath).toBuffer();
        const compressedBuffer = await sharp(compressedPath).toBuffer();

        // Calculate SSIM
        const ssimScore = ssim(originalBuffer, compressedBuffer).ssim.toFixed(4);

        // Calculate PSNR
        const mse = calculateMSE(originalBuffer, compressedBuffer);
        const psnrScore = (10 * Math.log10((255 * 255) / mse)).toFixed(2); // Convert MSE to PSNR (dB)

        // Remove original image after compression
        fs.unlinkSync(originalPath);

        res.json({
            success: true,
            path: `https://compressionapp.onrender.com/uploads/${path.basename(compressedPath)}`,
            compressedSize,
            sizeReduction,
            ssim: ssimScore,
            psnr: psnrScore
        });

    } catch (error) {
        console.error("Compression Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Function to calculate Mean Squared Error (MSE)
function calculateMSE(img1, img2) {
    if (img1.length !== img2.length) {
        console.error("Images must have the same dimensions for MSE calculation.");
        return 0;
    }
    let mse = 0;
    for (let i = 0; i < img1.length; i++) {
        mse += (img1[i] - img2[i]) ** 2;
    }
    return mse / img1.length;
}

// Root Route
app.get("/", (req, res) => {
    res.send("Compression Backend is Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
