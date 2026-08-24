import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.vaultofcodes.in';
const SEARCH_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Vercel Serverless Function: Real-time URL Search
 * Searches VaultOfCodes website for relevant URLs based on user query
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, intent } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[API: Search URL] Query: "${query}", Intent: ${intent}`);

    // Step 1: Check known URL patterns first (fast path)
    const knownUrlResult = await checkKnownPatterns(query, intent || 'general_query');
    if (knownUrlResult) {
      console.log(`[API: Search URL] ✓ Found via known pattern: ${knownUrlResult.url}`);
      return res.status(200).json(knownUrlResult);
    }

    // Step 2: Search homepage for relevant links
    const homepageResult = await searchHomepage(query, intent || 'general_query');
    if (homepageResult) {
      console.log(`[API: Search URL] ✓ Found via homepage search: ${homepageResult.url}`);
      return res.status(200).json(homepageResult);
    }

    // Step 3: Search courses page for specific courses
    if (intent && (intent.includes('course') || intent.includes('training'))) {
      const coursesResult = await searchCoursesPage(query);
      if (coursesResult) {
        console.log(`[API: Search URL] ✓ Found specific course: ${coursesResult.url}`);
        return res.status(200).json(coursesResult);
      }
    }

    // Step 4: Search internships page
    if (intent && intent.includes('internship')) {
      const internshipsResult = await searchInternshipsPage();
      if (internshipsResult) {
        console.log(`[API: Search URL] ✓ Found internship: ${internshipsResult.url}`);
        return res.status(200).json(internshipsResult);
      }
    }

    console.log(`[API: Search URL] ✗ No specific URL found`);
    return res.status(200).json({ found: false });

  } catch (error) {
    console.error(`[API: Search URL] Error:`, error);
    return res.status(500).json({ 
      error: 'Failed to search for URL', 
      message: error.message 
    });
  }
}

/**
 * Check known URL patterns (fast path)
 */
async function checkKnownPatterns(query, intent) {
  const lowerQuery = query.toLowerCase();

  // Direct pattern matches - exact URLs from user's mapping
  const patterns = [
    { 
      test: () => intent === 'certificate_verification' || lowerQuery.includes('verify') || lowerQuery.includes('validate certificate'), 
      url: '/validate',
      title: 'Validate Certificate - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => lowerQuery.includes('contact') || lowerQuery.includes('support') || lowerQuery.includes('reach out'), 
      url: '/contact-us',
      title: 'Contact Us - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => lowerQuery.includes('about') || lowerQuery.includes('who are') || lowerQuery.includes('tell me about vaultofcodes'), 
      url: '/about-us',
      title: 'About Us - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => lowerQuery.includes('testimonial') || lowerQuery.includes('review') || lowerQuery.includes('feedback'), 
      url: '/testimonials',
      title: 'Testimonials - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => lowerQuery.includes('free test'), 
      url: '/freetest',
      title: 'Free Tests - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => lowerQuery.includes('free') && (lowerQuery.includes('content') || lowerQuery.includes('material') || lowerQuery.includes('study')), 
      url: '/free-content',
      title: 'Free Content - VaultOfCodes',
      confidence: 0.95
    },
    { 
      test: () => intent.includes('internship') || lowerQuery.includes('internship') || lowerQuery.includes('apply for internship'),
      url: '/internships',
      title: 'Internships - VaultOfCodes',
      confidence: 0.95
    },
    {
      test: () => lowerQuery.includes('python') && (lowerQuery.includes('course') || lowerQuery.includes('training')),
      url: '/courses/506722',
      title: 'Python Course - VaultOfCodes',
      confidence: 0.90
    },
    {
      test: () => (lowerQuery.includes('web development') || lowerQuery.includes('web dev') || lowerQuery.includes('website')) && (lowerQuery.includes('course') || lowerQuery.includes('training')),
      url: '/courses/506813',
      title: 'Web Development Course - VaultOfCodes',
      confidence: 0.90
    }
  ];

  for (const pattern of patterns) {
    if (pattern.test()) {
      const url = BASE_URL + pattern.url;
      const verified = await verifyUrlExists(url);
      if (verified) {
        return {
          found: true,
          url,
          title: pattern.title,
          matchType: 'known-pattern',
          confidence: pattern.confidence,
          realtime: true
        };
      }
    }
  }

  return null;
}

/**
 * Search homepage for relevant links
 */
async function searchHomepage(query, intent) {
  const cacheKey = `homepage_${query}`;
  
  // Check cache
  if (SEARCH_CACHE.has(cacheKey)) {
    const cached = SEARCH_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }
  }

  try {
    const response = await fetch(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const links = [];
    
    // Extract all links with their text
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim().toLowerCase();
      
      if (href && text) {
        links.push({ href, text });
      }
    });

    // Search for relevant link
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(' ').filter(w => w.length > 3);

    for (const link of links) {
      const matchScore = keywords.filter(k => 
        link.text.includes(k) || link.href.toLowerCase().includes(k)
      ).length;

      if (matchScore > 0) {
        let fullUrl = link.href;
        if (link.href.startsWith('/')) {
          fullUrl = BASE_URL + link.href;
        }

        if (fullUrl.startsWith(BASE_URL)) {
          const title = await getPageTitle(fullUrl);
          const result = {
            found: true,
            url: fullUrl,
            title: title || 'VaultOfCodes Page',
            matchType: 'homepage-link',
            confidence: 0.80,
            realtime: true
          };

          // Cache result
          SEARCH_CACHE.set(cacheKey, {
            result,
            timestamp: Date.now()
          });

          return result;
        }
      }
    }

  } catch (error) {
    console.error('[Homepage Search] Error:', error.message);
  }

  return null;
}

/**
 * Search courses page for specific courses
 */
async function searchCoursesPage(query) {
  const cacheKey = `courses_${query}`;
  
  if (SEARCH_CACHE.has(cacheKey)) {
    const cached = SEARCH_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/courses`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract technology from query
    const lowerQuery = query.toLowerCase();
    const technologies = {
      python: ['python', 'py'],
      web: ['web', 'website', 'html', 'css', 'javascript', 'frontend', 'backend'],
      java: ['java'],
      data: ['data science', 'data analytics', 'data'],
      ai: ['ai', 'artificial intelligence', 'machine learning', 'ml'],
      android: ['android', 'mobile'],
      ios: ['ios', 'iphone']
    };

    let detectedTech = null;
    for (const [tech, patterns] of Object.entries(technologies)) {
      if (patterns.some(p => lowerQuery.includes(p))) {
        detectedTech = tech;
        break;
      }
    }

    // Search for course links
    const courseLinks = [];
    $('a[href*="/courses/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim().toLowerCase();
      const parent = $(elem).parent().text().toLowerCase();

      if (href && href.match(/\/courses\/\d+/)) {
        courseLinks.push({
          href,
          text: text + ' ' + parent
        });
      }
    });

    // Find best match
    if (detectedTech) {
      for (const link of courseLinks) {
        if (link.text.includes(detectedTech)) {
          let fullUrl = link.href;
          if (link.href.startsWith('/')) {
            fullUrl = BASE_URL + link.href;
          }

          const title = await getPageTitle(fullUrl);
          const result = {
            found: true,
            url: fullUrl,
            title: title || `${detectedTech.toUpperCase()} Course - VaultOfCodes`,
            matchType: 'course-specific',
            technology: detectedTech,
            confidence: 0.90,
            realtime: true
          };

          SEARCH_CACHE.set(cacheKey, {
            result,
            timestamp: Date.now()
          });

          return result;
        }
      }
    }

    // Return general courses page if no specific course found
    const result = {
      found: true,
      url: `${BASE_URL}/courses`,
      title: 'Courses - VaultOfCodes',
      matchType: 'course-general',
      confidence: 0.75,
      realtime: true
    };

    SEARCH_CACHE.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;

  } catch (error) {
    console.error('[Courses Search] Error:', error.message);
  }

  return null;
}

/**
 * Search internships page
 */
async function searchInternshipsPage() {
  try {
    const url = `${BASE_URL}/internships`;
    const verified = await verifyUrlExists(url);
    
    if (verified) {
      return {
        found: true,
        url,
        title: 'Internships - VaultOfCodes',
        matchType: 'internship',
        confidence: 0.95,
        realtime: true
      };
    }

  } catch (error) {
    console.error('[Internships Search] Error:', error.message);
  }

  return null;
}

/**
 * Verify if URL exists
 */
async function verifyUrlExists(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get page title
 */
async function getPageTitle(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim();
    return title || null;

  } catch (error) {
    return null;
  }
}
