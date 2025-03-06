const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const app = express();

// ✅ Allow CORS for your frontend
app.use(cors({
    origin: "https://compression1.vercel.app", // Replace with your actual frontend URL
    methods: "GET,POST",
    allowedHeaders: "Content-Type"
}));

// ✅ Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Serve uploaded images as static files
app.use("/uploads", express.static(uploadDir));

// 🛠 Configure Multer storage (store original file temporarily)
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage });

// ✅ Handle Image Upload with WebP Conversion
app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const originalSize = req.file.size; // Get original file size in bytes
    const webpFilename = `${Date.now()}.webp`;
    const webpPath = path.join(uploadDir, webpFilename);

    try {
        // ✅ Convert image to WebP
        await sharp(req.file.path)
            .resize({ width: 800 }) // Resize if needed
            .webp({ quality: 100 }) // Convert to WebP format
            .toFile(webpPath);

        // ✅ Delete the original uploaded file
        fs.unlinkSync(req.file.path);

        // ✅ Get the final compressed file size
        const compressedSize = fs.statSync(webpPath).size; // Get compressed size in bytes

        // ✅ Calculate loss percentage
        const lossPercentage = ((1 - (compressedSize / originalSize)) * 100).toFixed(2);

        // ✅ Construct the image URL
        const imageUrl = `https://compressionapp.onrender.com/uploads/${webpFilename}`;

        res.json({ success: true, path: imageUrl, compressedSize, lossPercentage });

    } catch (error) {
        console.error("Sharp error:", error);
        res.status(500).json({ success: false, error: "Image conversion failed" });
    }
});



// ✅ Root Route
app.get("/", (req, res) => {
    res.send("Compression Backend is Running 🚀");
});

// ✅ Force file download instead of opening in browser
app.get("/download/:filename", (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);

    // ✅ Check if file exists
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
        res.setHeader("Content-Type", "image/webp");
        res.download(filePath); // Force file download
    } else {
        res.status(404).json({ success: false, error: "File not found" });
    }
});


// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

