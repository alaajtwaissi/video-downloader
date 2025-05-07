const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function downloadVideo(url) {
    const filename = `video-${Date.now()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: "stream" });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve({ filename, filePath }));
        writer.on("error", reject);
    });
}

module.exports = { downloadVideo };
