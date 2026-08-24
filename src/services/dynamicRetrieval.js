import { knowledgeCache, retrieveContext, formatContextForPrompt } from './knowledgeCache.js';
import { fetchWebsitePage, discoverPages } from './websiteFetcher.js';
import { getAllSeedUrls, getPriorityUrls, getSeedUrlsByCategory, getFreshnessThreshold } from '../config/sourceUrls.js';

/**
 * Query-aware dynamic retrieval with seeded URLs
 * Fetches fresh website content only when needed
 * @param {string} query - User query
 * @param {string} intent - Detected intent
 * @returns {Promise<Object>} Retrieved context with fresh data if needed
 */
export async function dynamicRetrieve(query, intent) {
  console.log(`[Dynamic Retrieval] Query: "${query}", Intent: ${intent}`);

  // Step 1: Try local cache first
  const category = mapIntentToCategory(intent);
  const cachedContext = retrieveContext(query, category);

  // Step 2: Determine if we need to fetch
  const needsFetch = cachedContext.documents.length === 0 || 
                     cachedContext.needsRefresh ||
                     cachedContext.documents.every(doc => doc.sourceType === 'static_verified');

  // Step 3: If we have fresh website data, use it
  if (!needsFetch && cachedContext.documents.length > 0) {
    console.log('[Dynamic Retrieval] Using cached data');
    return {
      success: true,
      context: cachedContext,
      source: 'cache',
      formatted: formatContextForPrompt(cachedContext)
    };
  }

  // Step 4: Fetch from seeded URLs
  console.log('[Dynamic Retrieval] Fetching fresh content from seeded URLs...');

  try {
    // Get relevant seed URLs for this category
    let relevantSeedUrls = getSeedUrlsByCategory(category);
    
    // If no specific category URLs or category is 'general', use priority URLs
    if (relevantSeedUrls.length === 0 || category === 'general') {
      relevantSeedUrls = getPriorityUrls();
    }

    // For keyword-rich queries, also try to match URLs by keywords
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 4);
    const keywordUrls = getAllSeedUrls().filter(source => {
      const urlText = `${source.url} ${source.description}`.toLowerCase();
      return keywords.some(keyword => urlText.includes(keyword));
    });

    // Combine and deduplicate
    const urlsToFetch = [...new Set([
      ...relevantSeedUrls.map(s => s.url),
      ...keywordUrls.slice(0, 3).map(s => s.url)
    ])];

    const freshData = await fetchSeedUrls(urlsToFetch.slice(0, 5));
    
    if (freshData.length > 0) {
      // Update cache
      freshData.forEach(doc => knowledgeCache.addDocument(doc));

      // Retrieve again from updated cache
      const updatedContext = retrieveContext(query, category);
      
      return {
        success: true,
        context: updatedContext,
        source: 'website',
        freshlyFetched: true,
        formatted: formatContextForPrompt(updatedContext)
      };
    } else {
      // No fresh data found, use stale cache if available
      if (cachedContext.documents.length > 0) {
        console.log('[Dynamic Retrieval] Using stale cache as fallback');
        return {
          success: true,
          context: cachedContext,
          source: 'stale_cache',
          formatted: formatContextForPrompt(cachedContext)
        };
      }

      // No data at all
      return {
        success: false,
        context: { documents: [] },
        source: 'none',
        error: 'No verified information available',
        formatted: formatContextForPrompt({ documents: [] })
      };
    }

  } catch (error) {
    console.error('[Dynamic Retrieval] Error:', error.message);

    // Use stale cache as fallback on error
    if (cachedContext.documents.length > 0) {
      return {
        success: true,
        context: cachedContext,
        source: 'stale_cache',
        formatted: formatContextForPrompt(cachedContext)
      };
    }

    return {
      success: false,
      context: { documents: [] },
      source: 'error',
      error: error.message,
      formatted: formatContextForPrompt({ documents: [] })
    };
  }
}

/**
 * Fetch multiple seed URLs
 */
async function fetchSeedUrls(urls) {
  const fetchedDocs = [];

  for (const url of urls.slice(0, 5)) { // Limit to 5 URLs per query
    try {
      console.log(`[Seed Fetch] Fetching: ${url}`);
      const result = await fetchWebsitePage(url);
      if (result.success) {
        fetchedDocs.push(result);
      }
      
      // Rate limiting
      await sleep(1000);
    } catch (error) {
      console.error(`[Seed Fetch] Error fetching ${url}:`, error.message);
    }
  }

  return fetchedDocs;
}

/**
 * Map intent to category
 */
function mapIntentToCategory(intent) {
  const mapping = {
    course_inquiry: 'course',
    training_inquiry: 'course',
    internship_inquiry: 'internship',
    workshop_inquiry: 'workshop',
    certificate_query: 'certificate',
    certificate_verification: 'certificate',
    offer_letter_query: 'offer_letter',
    enrollment_query: 'course',
    payment_query: 'support',
    website_navigation: 'general',
    technical_support: 'support',
    human_support: 'support',
    general_query: 'general'
  };

  return mapping[intent] || 'general';
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Initialize knowledge base by fetching all seed URLs
 * This should be called during app startup or via /api/refresh
 */
export async function initializeKnowledgeBase() {
  console.log('[Initialize] Starting seeded knowledge base initialization...');

  try {
    knowledgeCache.initialize();

    // Get all enabled seed URLs
    const seedUrls = getAllSeedUrls();
    console.log(`[Initialize] Found ${seedUrls.length} seed URLs to fetch`);

    let successCount = 0;
    let failedUrls = [];

    for (const seedSource of seedUrls) {
      try {
        console.log(`[Initialize] Fetching: ${seedSource.url} (${seedSource.category})`);
        const result = await fetchWebsitePage(seedSource.url);
        
        if (result.success) {
          // Enhance with seed metadata
          result.category = result.category || seedSource.category;
          result.priority = seedSource.priority;
          result.description = seedSource.description;
          
          knowledgeCache.addDocument(result);
          successCount++;
          
          console.log(`[Initialize] ✓ Success: ${seedSource.description}`);
        } else {
          failedUrls.push({
            url: seedSource.url,
            error: result.error,
            status: result.status
          });
          console.log(`[Initialize] ✗ Failed: ${seedSource.url} - ${result.error}`);
        }
        
        await sleep(1000); // Rate limiting
      } catch (error) {
        failedUrls.push({
          url: seedSource.url,
          error: error.message
        });
        console.error(`[Initialize] ✗ Error fetching ${seedSource.url}:`, error.message);
      }
    }

    const stats = knowledgeCache.getStats();
    console.log(`[Initialize] Complete. Success: ${successCount}/${seedUrls.length}`, stats);

    return {
      success: true,
      totalSeedUrls: seedUrls.length,
      fetchedPages: successCount,
      failedPages: failedUrls.length,
      failedUrls,
      totalDocuments: stats.total,
      stats
    };

  } catch (error) {
    console.error('[Initialize] Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Refresh stale documents
 */
export async function refreshStaleDocuments() {
  console.log('[Refresh] Checking for stale documents...');
  
  const stale = knowledgeCache.getStaleDocuments();
  
  if (stale.length === 0) {
    console.log('[Refresh] All documents are fresh');
    return {
      success: true,
      refreshed: 0,
      message: 'All documents are fresh'
    };
  }

  console.log(`[Refresh] Found ${stale.length} stale documents`);
  
  let refreshed = 0;
  for (const doc of stale.slice(0, 10)) { // Limit to 10 per refresh
    try {
      const result = await fetchWebsitePage(doc.url);
      if (result.success) {
        knowledgeCache.addDocument(result);
        refreshed++;
      }
      await sleep(1000);
    } catch (error) {
      console.error(`[Refresh] Error refreshing ${doc.url}:`, error.message);
    }
  }

  console.log(`[Refresh] Refreshed ${refreshed} documents`);
  
  return {
    success: true,
    refreshed,
    total: stale.length
  };
}
