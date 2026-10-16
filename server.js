const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/notion/query', async (req, res) => {
  try {
    const { apiKey, databaseId, startCursor } = req.body;

    if (!apiKey || !databaseId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: apiKey or databaseId.' 
      });
    }

    // Clean Database ID (removes hyphens, spaces, and URL parameters)
    let cleanDbId = databaseId.trim();
    if (cleanDbId.includes('?')) cleanDbId = cleanDbId.split('?')[0];
    if (cleanDbId.includes('/')) cleanDbId = cleanDbId.split('/').pop();
    cleanDbId = cleanDbId.replace(/-/g, '');

    // Format query payload
    const requestBody = {};
    if (startCursor) {
      requestBody.start_cursor = startCursor;
    }

    // Target Notion's core database query endpoint
    const notionUrl = `https://api.notion.com/v1/databases/${cleanDbId}/query`;

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion API Error:', data);
      return res.status(response.status).json({
        error: data.message || 'Notion API request rejected',
        code: data.code || 'notion_error'
      });
    }

    return res.json(data);

  } catch (err) {
    console.error('Proxy Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal proxy server error' });
  }
});

app.get('/', (req, res) => {
  res.send('eFootball Notion Sync Proxy is active!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
