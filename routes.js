// routes.js

const express = require("express");
const router = express.Router();
const { downloadVideo } = require("./services/video");
const fs = require("fs");
const path = require("path");

let activeDownloads = {};
const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");

// Download video from direct URL
router.post("/api/start-download", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const downloadId = `dl-${Date.now()}`;
    activeDownloads[downloadId] = { status: "started", progress: 0 };

    try {
        const result = await downloadVideo(url);
        activeDownloads[downloadId] = { status: "completed", result };
        res.json({ downloadId });
    } catch (err) {
        activeDownloads[downloadId] = { status: "failed", error: err.message };
        res.status(500).json({ error: err.message });
    }
});

// Check download progress
router.get("/api/download-progress/:id", (req, res) => {
    const { id } = req.params;
    const progress = activeDownloads[id] || { status: "not_found" };
    res.json(progress);
});

// Convert video to MP4
router.get("/api/convert-to-mp4", async (req, res) => {
    const { url } = req.query;
    const filename = `video-${Date.now()}.mp4`;

    const inputPath = await downloadTempFile(url, filename);
    const outputFilename = "converted-" + Date.now();

    try {
        const resultPath = await convertToMP4(inputPath, outputFilename);
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Convert video to MP3
router.get("/api/convert-to-mp3", async (req, res) => {
    const { url } = req.query;
    const filename = `video-${Date.now()}.mp4`;

    const inputPath = await downloadTempFile(url, filename);
    const outputFilename = "audio-" + Date.now();

    try {
        const resultPath = await convertToMP3(inputPath, outputFilename);
        res.download(resultPath);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper: Download Temp File
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

// Helper: MP4 Conversion
function convertToMP4(inputPath, outputFilename) {
    const ffmpeg = require("fluent-ffmpeg");
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const outputPath = path.join(
        __dirname,
        "../converted",
        `${outputFilename}.mp4`,
    );

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions("-c:v copy")
            .outputOptions("-c:a aac")
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .saveToFile(outputPath);
    });
}

// Helper: MP3 Conversion
function convertToMP3(inputPath, outputFilename) {
    const ffmpeg = require("fluent-ffmpeg");
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const outputPath = path.join(
        __dirname,
        "../converted",
        `${outputFilename}.mp3`,
    );

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions("-vn")
            .outputOptions("-ab 192k")
            .outputOptions("-ar 44100")
            .outputOptions("-f mp3")
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .saveToFile(outputPath);
    });
}

module.exports = router;
