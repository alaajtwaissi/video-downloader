const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUTPUT_DIR = path.resolve(__dirname, "../converted");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function isValidVideoFile(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        // Check if the file starts with MP4 signature
        const header = data.slice(0, 4).toString("hex");
        return header === "0000001466747970" || header === "33676701"; // MP4/MOV headers
    } catch (err) {
        return false;
    }
}

async function convertToMP4(inputPath, outputFilename) {
    const outputPath = path.join(OUTPUT_DIR, `${outputFilename}.mp4`);

    return new Promise((resolve, reject) => {
        if (!isValidVideoFile(inputPath)) {
            return reject("Invalid video file — cannot convert");
        }

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
        if (!isValidVideoFile(inputPath)) {
            return reject("Invalid video file — cannot extract audio");
        }

        ffmpeg(inputPath)
            .outputOptions("-vn")
            .outputOptions("-ab 192k")
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .saveToFile(outputPath);
    });
}

module.exports = { convertToMP4, convertToMP3 };
