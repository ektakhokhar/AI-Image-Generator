require('dotenv').config();
const express = require('express');
const cors = require('cors');  // <-- import cors
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your frontend domain (GitHub Pages)
app.use(cors({
  origin: 'https://ektakhokhar.github.io',  // your frontend URL here
  methods: ['GET', 'POST'],
}));

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Image generation endpoint
app.post('/generate-image', async (req, res) => {
  const { model, prompt, width, height, count } = req.body;

  try {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${model}`;
    const images = [];

    for (let i = 0; i < count; i++) {
      const response = await fetch(MODEL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API Error: ${errorText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const imageDataUrl = `data:image/png;base64,${base64}`;
      images.push(imageDataUrl);
    }

    res.json({ images });

  } catch (error) {
    console.error('❌ Error generating images:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
