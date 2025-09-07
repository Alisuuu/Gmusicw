const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

const INVIDIOUS_INSTANCE = 'https://yewtu.be';

app.use(express.static('public'));
app.use(express.static('.'));

// Search endpoint (kept for now, might be removed later if only playlist is desired)
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }

    console.log(`Searching Invidious for: ${query}`);

    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        const formattedResults = data.filter(item => item.type === 'video').map(item => ({
            videoId: item.videoId,
            title: item.title,
            thumbnail: item.videoThumbnails ? item.videoThumbnails[0].url : '',
            author: item.author,
            duration: item.lengthSeconds ? new Date(item.lengthSeconds * 1000).toISOString().substr(11, 8) : ''
        }));
        res.json(formattedResults);

    } catch (error) {
        console.error('Error during Invidious search:', error);
        res.status(500).json({ error: 'Failed to search for songs using Invidious.', details: error.message });
    }
});

// New endpoint to get playlist content
app.get('/playlist-content', async (req, res) => {
    const playlistId = req.query.playlistId;
    if (!playlistId) {
        return res.status(400).json({ error: 'playlistId parameter is required.' });
    }

    console.log(`Fetching Invidious playlist: ${playlistId}`);

    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/playlists/${playlistId}`);
        const data = await response.json();

        if (data && data.videos) {
            const formattedPlaylistItems = data.videos.map(item => ({
                videoId: item.videoId,
                title: item.title,
                thumbnail: item.videoThumbnails ? item.videoThumbnails[0].url : '',
                author: item.author,
                duration: item.lengthSeconds ? new Date(item.lengthSeconds * 1000).toISOString().substr(11, 8) : ''
            }));
            res.json(formattedPlaylistItems);
        } else {
            res.status(500).json({ error: 'Could not retrieve playlist content from Invidious.' });
        }

    } catch (error) {
        console.error('Error fetching Invidious playlist:', error);
        res.status(500).json({ error: 'Failed to fetch playlist content using Invidious.', details: error.message });
    }
});

// Play endpoint
app.get('/play', async (req, res) => {
    const videoId = req.query.videoId;
    if (!videoId) {
        return res.status(400).json({ error: 'videoId parameter is required.' });
    }

    console.log(`Getting audio URL from Invidious for videoId: ${videoId}`);

    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/videos/${videoId}`);
        const data = await response.json();

        if (data && data.formatStreams) {
            const audioStream = data.formatStreams.find(stream => stream.mimeType.startsWith('audio/') && !stream.mimeType.includes('video'));

            if (audioStream && audioStream.url) {
                res.json({ audioUrl: audioStream.url });
            } else {
                res.status(500).json({ error: 'No suitable audio stream found for this video.' });
            }
        } else {
            res.status(500).json({ error: 'Could not retrieve video information from Invidious.' });
        }

    } catch (error) {
        console.error('Error getting audio URL from Invidious:', error);
        res.status(500).json({ error: 'Failed to get audio URL using Invidious.', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});