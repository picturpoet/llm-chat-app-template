import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AutoRAG API configuration
const CLOUDFLARE_ACCOUNT_ID = '718cffdc8670cff4c3d9b45b84ef88f9';
const AUTORAG_ID = 'aeroarmour-brandbox';
const BEARER_TOKEN = 'kDFUMalyWWXP0g_EiutMz6EMIzdB-LPjZWVsDpgC';
const AUTORAG_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${AUTORAG_ID}/ai-search`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Call Cloudflare AutoRAG API
    const response = await fetch(AUTORAG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
      body: JSON.stringify({
        query: query.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AutoRAG API Error:', response.status, errorText);
      throw new Error(`AutoRAG API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Set up Server-Sent Events for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Send the response from AutoRAG
    if (data.success && data.result) {
      // Stream the response character by character for a more natural feel
      const responseText = data.result.answer || 'No answer provided';
      const words = responseText.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        res.write(JSON.stringify({ response: word }) + '\n');
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      res.write(JSON.stringify({ response: 'Sorry, I could not find a relevant answer to your question.' }) + '\n');
    }

    res.end();
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AutoRAG Chat API' });
});

app.listen(PORT, () => {
  console.log(`AutoRAG Chat API server running on http://localhost:${PORT}`);
});