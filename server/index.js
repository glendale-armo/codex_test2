require('dotenv/config');
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/explain', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 240,
      messages: [
        {
          role: 'system',
          content:
            'You explain highlighted passages in simple, precise terms. Output <= 120 words. Use 3 bullet points max. Retain critical terminology. Define jargon in-line. No greetings, no preamble, no citations.'
        },
        { role: 'user', content: `Explain this in simple terms:\n\n${text}` }
      ]
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? '';
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
