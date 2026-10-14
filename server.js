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

    // Clean Database ID (removes hyphens, spaces, and URL paths)
    let cleanDbId = databaseId.trim();
    if (cleanDbId.includes('?')) cleanDbId = cleanDbId.split('?')[0];
    if (cleanDbId.includes('/')) cleanDbId = cleanDbId.split('/').pop();
    cleanDbId = cleanDbId.replace(/-/g, '');

    // Format query request body for Notion
    const requestBody = {};
    if (startCursor) {
      requestBody.start_cursor = startCursor;
    }

    const notionUrl = `https://api.notion.com/v1/databases/${cleanDbId}/query`;

    const notionResponse = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error('Notion API Error:', data);
      return res.status(notionResponse.status).json({
        error: data.message || 'Notion API request failed',
        code: data.code || 'notion_error'
      });
    }

    return res.json(data);

  } catch (err) {
    console.error('Proxy Internal Error:', err);
    return res.status(500).json({ error: err.message || 'Internal proxy server error' });
  }
});

app.get('/', (req, res) => {
  res.send('eFootball Notion Sync Proxy is Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
