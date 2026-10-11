// Vercel Serverless Function entry point
// Connects Vercel HTTP requests to the Express.js application
const app = require('../backend/server');

module.exports = (req, res) => {
  // Normalize request path so it matches Express /api routes if proxy stripped prefix
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
};
