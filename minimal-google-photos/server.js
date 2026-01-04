const express = require('express');
const { google } = require('googleapis');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = 3001;

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
);

const CALLBACK_PATH = new URL(REDIRECT_URI).pathname;

const SCOPES = [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
    'https://www.googleapis.com/auth/photoslibrary.sharing',
    'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
    'profile',
    'email',
    'openid'
];

app.use(cookieParser());
app.use(express.static('public'));

app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
    res.redirect(url);
});

app.get(CALLBACK_PATH, async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        // In a real app, store these securely. For minimal example, use a cookie.
        res.cookie('google_tokens', JSON.stringify(tokens), { httpOnly: true });
        res.redirect('/');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/photos', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        // Google Photos Library API doesn't have a official Node.js client in 'googleapis'
        // so we use fetch with the access token.
        const accessToken = (await oauth2Client.getAccessToken()).token;

        const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=10', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        console.log('Google Photos API Response:', JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos', details: error.message });
    }
});

app.get('/api/albums', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) return res.status(401).json({ error: 'Not authenticated' });

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const response = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=10', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        console.log('Albums Response:', JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
});

app.get('/api/token-debug', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) return res.status(401).json({ error: 'Not authenticated' });

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const resp = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
        const data = await resp.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch token info' });
    }
});

app.get('/api/userinfo', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) return res.status(401).json({ error: 'Not authenticated' });

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await resp.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch userinfo' });
    }
});

app.get('/api/picker/start', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) return res.status(401).json({ error: 'Not authenticated' });

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start picker' });
    }
});

app.get('/api/picker/status/:sessionId', async (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie) return res.status(401).json({ error: 'Not authenticated' });

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${req.params.sessionId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const session = await response.json();
        console.log('Picker Session Status:', JSON.stringify(session, null, 2));

        if (session.mediaItemsSet) {
            // Session is complete, get the items
            const itemsResponse = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${req.params.sessionId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const itemsData = await itemsResponse.json();
            console.log('Picked Items Response:', JSON.stringify(itemsData, null, 2));
            res.json({ ready: true, items: itemsData.mediaItems || [] });
        } else {
            res.json({ ready: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to check picker status' });
    }
});

app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    const tokensCookie = req.cookies.google_tokens;
    if (!tokensCookie || !url) return res.status(401).send('Unauthorized');

    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);

    try {
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Google returned ${response.status}`);

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'image/jpeg');

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Failed to proxy image');
    }
});

app.get('/api/status', (req, res) => {
    const tokensCookie = req.cookies.google_tokens;
    res.json({ connected: !!tokensCookie });
});

app.get('/auth/logout', (req, res) => {
    res.clearCookie('google_tokens');
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Minimal Google Photos app listening at http://localhost:${PORT}`);
    console.log(`OAuth Callback Path: ${CALLBACK_PATH}`);
});
