const express = require("express");
const router = express.Router();
const { startDownload } = require("./services/playwright");
const { convertToMP4, convertToMP3 } = require("./services/converter");
const fs = require("fs");
const path = require("path");

let activeDownloads = {};
const TEMP_DIR = path.resolve(__dirname, "../downloads");
const OUTPUT_DIR = path.resolve(__dirname, "../converted");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Start download
router.post("/api/start-download", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const downloadId = `dl-${Date.now()}`;
    activeDownloads[downloadId] = { status: "started", progress: 0 };

    startDownload(url)
        .then((result) => {
            activeDownloads[downloadId] = { status: "completed", result };
            console.log("✅ Download completed:", result);
        })
        .catch((err) => {
            activeDownloads[downloadId] = {
                status: "failed",
                error: err.message,
            };
            console.error("❌ Download failed:", err.message);
        });

    res.json({ downloadId });
});

// Check progress
router.get("/api/download-progress/:id", (req, res) => {
    const { id } = req.params;
    const progress = activeDownloads[id] || { status: "not_found" };
    res.json(progress);
});

// Convert to MP4
router.get("/api/convert-to-mp4", async (req, res) => {
    const { url } = req.query;
    const inputPath = await downloadTempFile(url);
    const outputFilename = "converted-" + Date.now();

    try {
        const resultPath = await convertToMP4(inputPath, outputFilename);
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Convert to MP3
router.get("/api/convert-to-mp3", async (req, res) => {
    const { url } = req.query;
    const inputPath = await downloadTempFile(url);
    const outputFilename = "audio-" + Date.now();

    try {
        const resultPath = await convertToMP3(inputPath, outputFilename);
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

async function downloadTempFile(url) {
    const filename = `temp-${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: "stream" });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
    });
}

module.exports = router;
