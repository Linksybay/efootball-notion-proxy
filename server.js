const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Dual-endpoint handler (Database Query + Fallback)
app.post('/api/notion/query', async (req, res) => {
  const { apiKey, databaseId, startCursor } = req.body;

  if (!apiKey || !databaseId) {
    return res.status(400).json({ error: 'Missing apiKey or databaseId parameter' });
  }

  const cleanedId = databaseId.replace(/-/g, '');

  try {
    // 1. Primary Query: Standard Database Endpoint
    let notionUrl = `https://api.notion.com/v1/databases/${cleanedId}/query`;
    let response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28', // Compatible database query version
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {})
    });

    let data = await response.json();

    // 2. Fallback Query: If 404, try querying as a Data Source object
    if (response.status === 404) {
      const dataSourceUrl = `https://api.notion.com/v1/data_sources/${cleanedId}/query`;
      const dsResponse = await fetch(dataSourceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2025-09-03',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {})
      });

      if (dsResponse.ok) {
        data = await dsResponse.json();
        return res.status(dsResponse.status).json(data);
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Notion Sync Server Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('eFootball Notion Proxy Server is Online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
