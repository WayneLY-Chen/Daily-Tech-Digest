import express from 'express';
import { run } from './pipeline.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.post('/run', async (req, res) => {
  try {
    const result = await run();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[server] 監聽 port ${PORT}`);
  });
}

export { app };
