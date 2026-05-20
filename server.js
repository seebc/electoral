import app from './api/index.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Backend local ejecutándose en http://localhost:${port}`);
});
