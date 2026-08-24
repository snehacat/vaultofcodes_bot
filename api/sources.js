import { getAllSeedUrls } from '../src/config/sourceUrls.js';
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
    
    const seedUrls = getAllSeedUrls();
    const allDocs = knowledgeCache.getAllDocuments();
    
    // Map seed URLs to their fetch status
    const sourceStatus = seedUrls.map(seed => {
      const doc = allDocs.find(d => d.url === seed.url);
      
      if (!doc) {
        return {
          url: seed.url,
          category: seed.category,
          priority: seed.priority,
          description: seed.description,
          status: 'pending',
          lastFetched: null,
          isFresh: false
        };
      }
      
      return {
        url: seed.url,
        category: seed.category,
        priority: seed.priority,
        description: seed.description,
        status: doc.status || 'verified',
        lastFetched: doc.fetchedAt,
        lastVerified: doc.lastVerified,
        isFresh: knowledgeCache.isFresh(doc),
        contentHash: doc.contentHash,
        chunkCount: doc.chunks?.length || 0
      };
    });

    // Group by category
    const byCategory = {};
    sourceStatus.forEach(source => {
      if (!byCategory[source.category]) {
        byCategory[source.category] = [];
      }
      byCategory[source.category].push(source);
    });

    // Summary stats
    const summary = {
      totalSeedUrls: seedUrls.length,
      fetched: sourceStatus.filter(s => s.status !== 'pending').length,
      fresh: sourceStatus.filter(s => s.isFresh).length,
      stale: sourceStatus.filter(s => !s.isFresh && s.status !== 'pending').length,
      pending: sourceStatus.filter(s => s.status === 'pending').length
    };

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      sources: sourceStatus,
      byCategory,
      cacheStats: knowledgeCache.getStats()
    });

  } catch (error) {
    console.error('[API /sources] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
