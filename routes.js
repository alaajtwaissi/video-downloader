const express = require('express');
const router = express.Router();
const { startDownload } = require('./services/puppeteer');

router.post('/api/start-download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL' });
    }

    try {
        const result = await startDownload(url);
        res.json(result);
    } catch (err) {
        console.error('Download error:', err.message);
        res.status(500).json({ error: `Download failed: ${err.message}` });
    }
});

module.exports = router;