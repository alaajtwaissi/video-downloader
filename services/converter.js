const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUTPUT_DIR = path.resolve(__dirname, "../converted");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertToMP4(inputPath, outputFilename) {
    const outputPath = path.join(OUTPUT_DIR, `${outputFilename}.mp4`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions("-c:v copy")
            .outputOptions("-c:a aac")
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .saveToFile(outputPath);
    });
}

async function convertToMP3(inputPath, outputFilename) {
    const outputPath = path.join(OUTPUT_DIR, `${outputFilename}.mp3`);

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

module.exports = { convertToMP4, convertToMP3 };
