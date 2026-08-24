import { initializeKnowledgeBase, refreshStaleDocuments } from '../src/services/dynamicRetrieval.js';
import { knowledgeCache } from '../src/services/knowledgeCache.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional: Check for secret to prevent unauthorized refreshes
    const secret = req.headers.authorization?.replace('Bearer ', '');
    const expectedSecret = process.env.REFRESH_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[API /refresh] Starting seeded knowledge base refresh...');

    // Check query parameter for refresh type
    const refreshType = req.query.type || 'full';

    let result;
    
    if (refreshType === 'stale') {
      // Only refresh stale documents
      result = await refreshStaleDocuments();
    } else {
      // Full initialization with all seed URLs
      result = await initializeKnowledgeBase();
    }

    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Knowledge base refreshed successfully' : 'Refresh failed',
      refreshType,
      ...result
    });

  } catch (error) {
    console.error('[API /refresh] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
