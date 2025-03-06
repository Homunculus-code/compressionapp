const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "backend/uploads/" });

const cors = require("cors");

app.use(cors({
    origin: "http://compression.vercel.app",  // ✅ Allow requests from frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));


app.use(express.static("dist")); // Serve frontend
app.use("/uploads", express.static(path.join(__dirname, "backend/uploads")));

app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log("Received file:", req.file.originalname, "Size:", req.file.size, "bytes");

    const outputPath = `backend/uploads/compressed-${Date.now()}.webp`;
    const relativePath = `/uploads/${path.basename(outputPath)}`;

    try {
        await sharp(req.file.path)
            .resize({ width: 800 }) 
            .webp({ quality: 70 })
            .toFile(outputPath);

        const compressedSize = fs.statSync(outputPath).size;
        fs.unlinkSync(req.file.path); // Delete original file

        console.log("Compression successful! New Size:", compressedSize, "bytes");

        res.json({ success: true, path: relativePath, compressedSize }); // ✅ Always return JSON
    } catch (error) {
        console.error("Sharp Error:", error);
        res.status(500).json({ success: false, error: error.message }); // ✅ Return error in JSON
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
