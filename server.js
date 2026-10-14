const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS so your mobile APK / browser app can reach this backend
app.use(cors());
app.use(express.json());

// Proxy endpoint for querying Notion databases
app.post('/api/notion/query', async (req, res) => {
  const { apiKey, databaseId, startCursor } = req.body;

  if (!apiKey || !databaseId) {
    return res.status(400).json({ error: 'Missing apiKey or databaseId parameter' });
  }

  try {
    const notionUrl = 'https://api.notion.com/v1/databases/' + databaseId + '/query';
    const authHeader = 'Bearer ' + apiKey;

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {})
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Notion Proxy Request Failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('eFootball Notion Proxy Server is Active!');
});

// Bind to Render environment PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server is running on port ' + PORT));
