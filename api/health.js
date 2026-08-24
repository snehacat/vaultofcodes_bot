import { knowledgeCache } from '../src/services/knowledgeCache.js';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    knowledgeCache.initialize();
    const stats = knowledgeCache.getStats();

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      knowledgeBase: stats,
      environment: {
        hasGroqKey: !!process.env.GROQ_API_KEY || !!process.env.VITE_GROQ_API_KEY,
        hasRefreshSecret: !!process.env.REFRESH_SECRET
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
