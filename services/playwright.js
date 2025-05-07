const { chromium } = require("playwright-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DOWNLOAD_DIR = path.resolve(__dirname, "../downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function startDownload(url) {
    // If direct .mp4 link
    if (url.endsWith(".mp4")) {
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

    // For websites like YouTube
    try {
        const browser = await chromium.launch({
            executablePath: "/usr/bin/chromium-browser",
            headless: true,
        });

        const page = await browser.newPage();

        let videoUrl = null;

        await page.route("**/*.{mp4,m3u8,mpd}", async (route) => {
            videoUrl = route.request().url();
            await route.continue();
        });

        await page.goto(url, { waitUntil: "networkidle" });

        // Try to get video URL from <video> tag
        const src = await page.evaluate(() => {
            const video = document.querySelector("video");
            return video?.src;
        });

        if (src && /\.(mp4|m3u8|mpd)$/.test(src)) {
            videoUrl = src;
        }

        await new Promise((r) => setTimeout(r, 5000));

        if (!videoUrl) throw new Error("No video stream found");

        // Download the video
        const response = await axios.get(videoUrl, { responseType: "stream" });
        const filename = `video-${Date.now()}.mp4`;
        const filePath = path.join(DOWNLOAD_DIR, filename);

        const writer = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        await browser.close();

        return { filename, filePath };
    } catch (err) {
        throw err;
    }
}

module.exports = { startDownload };
