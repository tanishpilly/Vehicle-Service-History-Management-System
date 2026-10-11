// Vercel Serverless Function entry point
// Connects Vercel HTTP requests to the Express.js application
const app = require('../backend/server');

module.exports = (req, res) => {
  // If Vercel rewrote the URL to /api/index.js or /api, recover original requested path
  if (req.url === '/api/index.js' || req.url === '/api/index' || req.url === '/api') {
    const original = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (original && original !== '/api/index.js' && original !== '/api/index') {
      req.url = original;
    }
  }

  // Normalize request path so it matches Express /api routes if proxy stripped prefix
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
};
