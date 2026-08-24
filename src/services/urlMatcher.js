import urlMap from '../data/urlMap.json';

/**
 * URL Matcher - Maps user queries to exact VaultOfCodes URLs
 * NEVER invents or hallucinates URLs - only returns verified URLs from urlMap.json
 */

/**
 * Find the most specific matching URL for a user query
 * @param {string} query - User's question
 * @param {string} intent - Detected intent category
 * @returns {Object} Matched URL information or null
 */
export function findExactURL(query, intent) {
  const lowerQuery = query.toLowerCase();
  const pages = urlMap.pages;

  console.log(`[URL Matcher] Query: "${query}", Intent: ${intent}`);

  // Priority 1: Exact intent + entity match
  const entityMatch = matchWithEntity(lowerQuery, intent, pages);
  if (entityMatch) {
    console.log(`[URL Matcher] ✓ Entity match: ${entityMatch.url}`);
    return entityMatch;
  }

  // Priority 2: Category match
  const categoryMatch = matchByCategory(intent, pages);
  if (categoryMatch) {
    console.log(`[URL Matcher] ✓ Category match: ${categoryMatch.url}`);
    return categoryMatch;
  }

  // Priority 3: Keyword match
  const keywordMatch = matchByKeywords(lowerQuery, pages);
  if (keywordMatch) {
    console.log(`[URL Matcher] ✓ Keyword match: ${keywordMatch.url}`);
    return keywordMatch;
  }

  // Priority 4: Semantic similarity (title/description)
  const semanticMatch = matchBySemantic(lowerQuery, pages);
  if (semanticMatch) {
    console.log(`[URL Matcher] ✓ Semantic match: ${semanticMatch.url}`);
    return semanticMatch;
  }

  console.log(`[URL Matcher] ✗ No verified URL found`);
  return null;
}

/**
 * Match with specific entity (e.g., Python internship, Java course)
 */
function matchWithEntity(query, intent, pages) {
  // Extract technology/subject entities
  const entities = {
    python: ['python', 'py'],
    java: ['java'],
    javascript: ['javascript', 'js', 'node'],
    web: ['web development', 'web dev', 'frontend', 'backend', 'fullstack', 'full stack', 'html', 'css', 'website'],
    data: ['data science', 'data analytics', 'data analysis'],
    ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],
    android: ['android', 'mobile app'],
    ios: ['ios', 'iphone', 'swift']
  };

  // Check which entity is mentioned
  let detectedEntity = null;
  for (const [entity, patterns] of Object.entries(entities)) {
    if (patterns.some(pattern => query.includes(pattern))) {
      detectedEntity = entity;
      break;
    }
  }

  // Determine if looking for course or internship
  const isCourseLooking = intent.includes('course') || query.includes('course') || query.includes('training');
  const isInternshipLooking = intent.includes('internship') || query.includes('internship');

  // If looking for specific technology + course, find specific course page
  if (isCourseLooking && detectedEntity) {
    // Try to find technology-specific course page first
    const specificCoursePage = pages.find(page => 
      page.category.includes('course') &&
      page.category.includes('specific') &&
      (page.category.includes(detectedEntity) || 
       page.keywords.includes(detectedEntity) ||
       page.url.includes(detectedEntity) ||
       page.description?.toLowerCase().includes(detectedEntity))
    );

    if (specificCoursePage) {
      return {
        ...specificCoursePage,
        matchType: 'entity-specific-course',
        entity: detectedEntity,
        confidence: 0.95
      };
    }

    // Fallback to general courses page with entity info
    const generalCoursePage = pages.find(p => p.url.includes('/courses') && !p.url.match(/\/courses\/\d+/));
    if (generalCoursePage) {
      return {
        ...generalCoursePage,
        matchType: 'entity-general-course',
        entity: detectedEntity,
        confidence: 0.80
      };
    }
  }

  // If looking for internship (any technology), return internships page
  if (isInternshipLooking) {
    const internshipsPage = pages.find(p => p.url.includes('/internships'));
    if (internshipsPage) {
      return {
        ...internshipsPage,
        matchType: 'internship',
        entity: detectedEntity || 'general',
        confidence: 0.90
      };
    }
  }

  return null;
}

/**
 * Match by category/intent
 */
function matchByCategory(intent, pages) {
  // Map intents to page categories
  const intentMapping = {
    'course_inquiry': ['courses', 'course'],
    'training_inquiry': ['courses', 'course', 'training'],
    'internship_inquiry': ['internships', 'internship'],
    'certificate_query': ['certificate-verification', 'validate'],
    'certificate_verification': ['certificate-verification', 'validate'],
    'contact': ['contact'],
    'about': ['about'],
    'testimonial': ['testimonials'],
    'free_content': ['free-content', 'free content'],
    'free_test': ['free-tests', 'freetest'],
    'general_query': ['home']
  };

  const categories = intentMapping[intent] || [];

  for (const category of categories) {
    // Exact URL match first
    if (category === 'internships') {
      const internshipsPage = pages.find(p => p.url === 'https://www.vaultofcodes.in/internships');
      if (internshipsPage) {
        return {
          ...internshipsPage,
          matchType: 'category-exact',
          confidence: 0.90
        };
      }
    }

    if (category === 'free-content' || category === 'free content') {
      const freeContentPage = pages.find(p => p.url === 'https://www.vaultofcodes.in/free-content');
      if (freeContentPage) {
        return {
          ...freeContentPage,
          matchType: 'category-exact',
          confidence: 0.90
        };
      }
    }

    // General category match
    const page = pages.find(p => 
      p.category.includes(category) || 
      p.url.includes(category) ||
      p.title?.toLowerCase().includes(category)
    );

    if (page) {
      return {
        ...page,
        matchType: 'category',
        confidence: 0.85
      };
    }
  }

  return null;
}

/**
 * Match by keywords in query
 */
function matchByKeywords(query, pages) {
  const queryWords = query.match(/\b\w{4,}\b/g) || [];
  
  let bestMatch = null;
  let bestScore = 0;

  pages.forEach(page => {
    // Calculate keyword overlap score
    const matches = queryWords.filter(word => 
      page.keywords.includes(word.toLowerCase()) ||
      page.title.toLowerCase().includes(word) ||
      page.description.toLowerCase().includes(word)
    );

    const score = matches.length / Math.max(queryWords.length, 1);

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = {
        ...page,
        matchType: 'keyword',
        matchedKeywords: matches,
        confidence: score
      };
    }
  });

  return bestMatch;
}

/**
 * Semantic matching based on title and description similarity
 */
function matchBySemantic(query, pages) {
  let bestMatch = null;
  let bestScore = 0;

  pages.forEach(page => {
    const searchText = `${page.title} ${page.description}`.toLowerCase();
    
    // Simple word overlap scoring
    const queryWords = query.match(/\b\w{3,}\b/g) || [];
    const matches = queryWords.filter(word => searchText.includes(word));
    
    const score = matches.length / Math.max(queryWords.length, 1);

    if (score > bestScore && score > 0.2) {
      bestScore = score;
      bestMatch = {
        ...page,
        matchType: 'semantic',
        confidence: score
      };
    }
  });

  return bestMatch;
}

/**
 * Get URLs by specific category
 */
export function getURLsByCategory(category) {
  return urlMap.pages.filter(page => page.category.includes(category));
}

/**
 * Get all available URLs
 */
export function getAllURLs() {
  return urlMap.pages;
}

/**
 * Search URLs by keyword
 */
export function searchURLs(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return urlMap.pages.filter(page =>
    page.title.toLowerCase().includes(lowerKeyword) ||
    page.description.toLowerCase().includes(lowerKeyword) ||
    page.keywords.includes(lowerKeyword) ||
    page.url.includes(lowerKeyword)
  );
}

/**
 * Validate that URL exists in our verified database
 */
export function isVerifiedURL(url) {
  return urlMap.pages.some(page => page.url === url);
}

/**
 * Get URL metadata
 */
export function getURLMetadata(url) {
  return urlMap.pages.find(page => page.url === url);
}
