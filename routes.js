const express = require("express");
const router = express.Router();
const { convertToMP4, convertToMP3 } = require("./services/converter");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Download and Save Temp File
async function downloadTempFile(url, filename) {
    const filePath = path.join(DOWNLOAD_DIR, filename);
    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: "stream" });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
    });
}

// Convert to MP4
router.get("/api/convert-to-mp4", async (req, res) => {
    const { url } = req.query;
    const filename = `temp-${Date.now()}.mp4`;

    try {
        const inputPath = await downloadTempFile(url, filename);
        const resultPath = await convertToMP4(
            inputPath,
            "converted-" + Date.now(),
        );
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Convert to MP3
router.get("/api/convert-to-mp3", async (req, res) => {
    const { url } = req.query;
    const filename = `temp-${Date.now()}.mp4`;

    try {
        const inputPath = await downloadTempFile(url, filename);
        const resultPath = await convertToMP3(inputPath, "audio-" + Date.now());
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
