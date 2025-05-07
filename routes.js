const express = require("express");
const router = express.Router();
const { convertToMP4, convertToMP3 } = require("./services/converter");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

let activeDownloads = {};
const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");
const OUTPUT_DIR = path.resolve(__dirname, "../converted");

if (!fs.existsSync(DOWNLOAD_DIR))
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Direct Download
router.post("/api/start-download", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const downloadId = `dl-${Date.now()}`;
    activeDownloads[downloadId] = { status: "started", progress: 0 };

    const filename = `video-${Date.now()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    activeDownloads[downloadId] = {
        status: "completed",
        result: { filename, filePath },
    };
    res.json({ downloadId });
});

// Check Progress
router.get("/api/download-progress/:id", (req, res) => {
    const { id } = req.params;
    res.json(activeDownloads[id] || { status: "not_found" });
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

// Helper: Download Temp File
async function downloadTempFile(url) {
    const filename = `temp-${Date.now()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: "stream" });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
    });
}

module.exports = router;
