const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function startDownload(url) {
    // If it's already a direct .mp4 link, download it directly
    if (url.endsWith(".mp4")) {
        console.log("Direct MP4 link detected. Downloading...");
        console.log("URL:", url);

        const filename = `video-${Date.now()}.mp4`;
        const filePath = path.join(DOWNLOAD_DIR, filename);

        const writer = fs.createWriteStream(filePath);
        const response = await axios.get(url, { 
            responseType: "stream",
            timeout: 10000,
            validateStatus: false
        });
        
        if (response.status !== 200) {
            console.error(`Download failed with status: ${response.status}`);
            console.error(`Response headers:`, response.headers);
            throw new Error(`Failed to download: HTTP ${response.status}`);
        }

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () =>
                resolve({
                    status: "downloaded",
                    filename,
                    filePath,
                    size: fs.statSync(filePath).size,
                }),
            );
            writer.on("error", reject);
        });
    }

    // Otherwise, try to extract from website using Puppeteer
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    let videoUrl = null;

    await page.setRequestInterception(true);
    page.on("request", (req) => {
        const types = ["media", "xhr", "fetch"];
        if (types.includes(req.resourceType())) {
            const requestUrl = req.url();
            if (/\.(mp4|m3u8|mpd)$/.test(requestUrl)) {
                videoUrl = requestUrl;
            }
        }
        req.continue();
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    if (!videoUrl) {
        await browser.close();
        throw new Error("No video stream found");
    }

    // Download the video
    const response = await fetch(videoUrl);
    const filename = `video-${Date.now()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
        response.body.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    await browser.close();

    return {
        status: "downloaded",
        filename,
        filePath,
        size: fs.statSync(filePath).size,
    };
}

module.exports = { startDownload };
