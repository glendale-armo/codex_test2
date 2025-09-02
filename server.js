const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/explain') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body || '{}');
        const prompt = `Explain this in simple way: ${text}`;
        const response = await client.responses.create({
          model: 'gpt-4o-mini',
          input: prompt,
          max_output_tokens: 150,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ explanation: response.output_text }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to explain' }));
      }
    });
    return;
  }

  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, requestedPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
