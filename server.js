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

    const requestBody = {};
    if (startCursor) {
      requestBody.start_cursor = startCursor;
    }

    // Attempt standard database query (Legacy compatibility header)
    let notionUrl = `https://api.notion.com/v1/databases/${cleanDbId}/query`;
    let response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    let data = await response.json();

    // Fallback: If 404 or multi-source database, query as Data Source (API 2025-09-03)
    if (response.status === 404 || (data.code && data.code.includes('data_source'))) {
      const dsUrl = `https://api.notion.com/v1/data_sources/${cleanDbId}/query`;
      const dsResponse = await fetch(dsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Notion-Version': '2025-09-03',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (dsResponse.ok) {
        data = await dsResponse.json();
        return res.json(data);
      }
    }

    if (!response.ok) {
      console.error('Notion API Rejected Request:', data);
      return res.status(response.status).json({
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
  res.send('eFootball Notion Sync Proxy is Active!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
