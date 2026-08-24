import * as cheerio from 'cheerio';
import { isValidUrl, CRAWLER_CONFIG, CONTENT_RULES, PRIORITY_KEYWORDS } from '../config/sources.js';

/**
 * Fetch and extract content from a trusted website page
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Extracted content
 */
export async function fetchWebsitePage(url) {
  try {
    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`URL not in trusted domain list: ${url}`);
    }

    console.log(`[Fetcher] Fetching: ${url}`);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CRAWLER_CONFIG.timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': CRAWLER_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > CRAWLER_CONFIG.maxResponseSize) {
      throw new Error(`Response too large: ${contentLength} bytes`);
    }

    const html = await response.text();

    // Extract content
    const extracted = extractContent(html, url);

    console.log(`[Fetcher] Successfully extracted: ${extracted.title}`);

    return {
      success: true,
      url,
      ...extracted,
      fetchedAt: new Date().toISOString(),
      status: 'verified'
    };

  } catch (error) {
    console.error(`[Fetcher] Error fetching ${url}:`, error.message);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        url,
        error: 'Request timeout',
        status: 'timeout'
      };
    }

    return {
      success: false,
      url,
      error: error.message,
      status: 'error'
    };
  }
}

/**
 * Extract clean content from HTML
 * @param {string} html - Raw HTML
 * @param {string} url - Source URL
 * @returns {Object} Extracted structured content
 */
function extractContent(html, url) {
  const $ = cheerio.load(html);

  // Remove noise elements
  CONTENT_RULES.removeSelectors.forEach(selector => {
    $(selector).remove();
  });

  // Extract title
  const title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                'Untitled Page';

  // Extract meta description
  const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      '';

  // Extract main content
  let content = '';
  const contentSelectors = ['main', 'article', '.content', '.main-content', 'body'];
  
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element.text();
      break;
    }
  }

  // Clean content
  content = cleanText(content);

  // Extract headings
  const headings = [];
  $('h1, h2, h3').each((i, el) => {
    const text = $(el).text().trim();
    if (text) {
      headings.push({
        level: el.name,
        text: text
      });
    }
  });

  // Extract internal links
  const links = [];
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    
    if (href && text) {
      try {
        const linkUrl = new URL(href, url);
        if (isValidUrl(linkUrl.href)) {
          links.push({
            url: linkUrl.href,
            text: text
          });
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });

  // Determine category based on content
  const category = determineCategory(title, content, url);

  // Create content chunks
  const chunks = createChunks(content, 500); // 500 char chunks

  // Calculate content hash for change detection
  const contentHash = simpleHash(content);

  return {
    title,
    description,
    content,
    headings,
    links,
    category,
    chunks,
    contentHash,
    sourceDomain: new URL(url).hostname
  };
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\n+/g, '\n')          // Normalize newlines
    .replace(/[^\S\n]+/g, ' ')      // Remove extra spaces
    .trim();
}

/**
 * Determine content category based on keywords
 */
function determineCategory(title, content, url) {
  const text = `${title} ${content} ${url}`.toLowerCase();

  if (text.match(/\b(course|courses|training|program)\b/)) return 'course';
  if (text.match(/\b(internship|internships|intern)\b/)) return 'internship';
  if (text.match(/\b(workshop|workshops)\b/)) return 'workshop';
  if (text.match(/\b(certificate|certification|verify|verification)\b/)) return 'certificate';
  if (text.match(/\b(offer\s*letter|appointment)\b/)) return 'offer_letter';
  if (text.match(/\b(faq|frequently|questions)\b/)) return 'faq';
  if (text.match(/\b(support|contact|help)\b/)) return 'support';
  if (text.match(/\b(about|mission|vision|team)\b/)) return 'about';

  return 'general';
}

/**
 * Split content into chunks for better retrieval
 */
function createChunks(content, chunkSize = 500) {
  const chunks = [];
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);

  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Simple hash function for content change detection
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Discover relevant pages from the base URL
 * @param {string} baseUrl - Starting URL
 * @param {number} maxPages - Maximum pages to discover
 * @returns {Promise<Array>} Array of discovered URLs
 */
export async function discoverPages(baseUrl, maxPages = 10) {
  try {
    console.log(`[Discovery] Starting from: ${baseUrl}`);
    
    const result = await fetchWebsitePage(baseUrl);
    if (!result.success) {
      throw new Error('Failed to fetch base page');
    }

    const discoveredUrls = new Set([baseUrl]);
    const priorityUrls = [];
    const normalUrls = [];

    // Categorize discovered links
    for (const link of result.links) {
      if (discoveredUrls.size >= maxPages) break;
      if (discoveredUrls.has(link.url)) continue;

      const isPriority = PRIORITY_KEYWORDS.some(keyword => 
        link.url.toLowerCase().includes(keyword) ||
        link.text.toLowerCase().includes(keyword)
      );

      if (isPriority) {
        priorityUrls.push(link.url);
      } else {
        normalUrls.push(link.url);
      }
    }

    // Add priority URLs first
    const selectedUrls = [...priorityUrls, ...normalUrls]
      .slice(0, maxPages - 1); // -1 because we already have baseUrl

    selectedUrls.forEach(url => discoveredUrls.add(url));

    console.log(`[Discovery] Found ${discoveredUrls.size} pages`);

    return Array.from(discoveredUrls);

  } catch (error) {
    console.error('[Discovery] Error:', error.message);
    return [baseUrl]; // Return at least the base URL
  }
}
