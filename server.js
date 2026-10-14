const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS so your app/APK can communicate with this server
app.use(cors());
app.use(express.json());

// Proxy endpoint for querying Notion databases
app.post('/api/notion/query', async (req, res) => {
const { apiKey, databaseId, startCursor } = req.body;

if (!apiKey || !databaseId) {
return res.status(400).json({ error: 'Missing apiKey or databaseId' });
}

try {
const notionResponse = await fetch(
https://api.notion.com/v1/databases/${databaseId}/query, { method: 'POST', headers: { 'Authorization':Bearer ${apiKey},
'Notion-Version': '2025-09-03',
'Content-Type': 'application/json',
},
body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
}
);

const data = await notionResponse.json();
return res.status(notionResponse.status).json(data);
} catch (err) {
console.error('Notion Proxy Error:', err);
return res.status(500).json({ error: err.message });
}
});

// Health check endpoint
app.get('/', (req, res) => {
res.send('eFootball Notion Sync Proxy is Running!');
});

// Render automatically injects the PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Proxy running on port ${PORT}));