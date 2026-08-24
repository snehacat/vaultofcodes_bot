/**
 * Verified Official VaultOfCodes URLs
 * These are the seed URLs for the Dynamic RAG system
 * DO NOT modify these URLs without verification from official VaultOfCodes sources
 */

export const SEED_URLS = [
  // Core Website Pages
  {
    url: 'https://www.vaultofcodes.in/',
    category: 'homepage',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'VaultOfCodes Homepage'
  },
  {
    url: 'https://www.vaultofcodes.in/about-us',
    category: 'about',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'About VaultOfCodes'
  },
  {
    url: 'https://www.vaultofcodes.in/contact-us',
    category: 'contact',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Contact Information'
  },
  {
    url: 'https://www.vaultofcodes.in/internships',
    category: 'internship',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Internship Programs'
  },
  {
    url: 'https://www.vaultofcodes.in/validate',
    category: 'certificate',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Certificate Validation'
  },
  {
    url: 'https://www.vaultofcodes.in/free-content',
    category: 'free_content',
    priority: 2,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Free Content & Resources'
  },
  {
    url: 'https://www.vaultofcodes.in/testimonials',
    category: 'testimonial',
    priority: 2,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Student Testimonials'
  },

  // Internship Orientation Pages
  {
    url: 'https://www.vaultofcodes.in/wlp/webinar-xnigwq-007',
    category: 'internship',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Internship Orientation - Current/Recent'
  },
  {
    url: 'https://www.vaultofcodes.in/wlp/webinar-xnigwq-01',
    category: 'internship',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Internship Orientation / Training Information'
  },

  // Verified Course Pages
  {
    url: 'https://www.vaultofcodes.in/courses/506722',
    category: 'course',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Python Programming Course'
  },
  {
    url: 'https://www.vaultofcodes.in/courses/506804',
    category: 'course',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Java Programming Course'
  },
  {
    url: 'https://www.vaultofcodes.in/courses/506813',
    category: 'course',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Web Development Course'
  },
  {
    url: 'https://www.vaultofcodes.in/courses/495473',
    category: 'course',
    priority: 1,
    enabled: true,
    sourceType: 'official_website',
    domain: 'vaultofcodes.in',
    description: 'Additional Course (name to be determined after fetch)'
  }
];

/**
 * Freshness policy for different content categories
 * Values in hours
 */
export const FRESHNESS_POLICY = {
  homepage: 48,
  about: 168,        // 7 days
  contact: 24,
  internship: 12,    // Most dynamic
  course: 24,
  certificate: 48,
  free_content: 168, // 7 days
  testimonial: 168,  // 7 days
  support: 24,
  faq: 24,
  default: 48
};

/**
 * Crawl configuration
 */
export const CRAWL_CONFIG = {
  MAX_CRAWL_DEPTH: 2,
  MAX_PAGES_PER_RUN: 50,
  REQUEST_TIMEOUT: 10000,
  MAX_CONTENT_SIZE: 2 * 1024 * 1024, // 2MB
  REQUEST_DELAY: 1000, // 1 second between requests
  USER_AGENT: 'VaultOfCodes-SupportBot/2.0',
  ENABLE_LINK_DISCOVERY: true
};

/**
 * Get seed URLs by category
 */
export function getSeedUrlsByCategory(category) {
  return SEED_URLS.filter(source => 
    source.enabled && source.category === category
  );
}

/**
 * Get all enabled seed URLs
 */
export function getAllSeedUrls() {
  return SEED_URLS.filter(source => source.enabled);
}

/**
 * Get priority URLs (priority 1)
 */
export function getPriorityUrls() {
  return SEED_URLS.filter(source => 
    source.enabled && source.priority === 1
  );
}

/**
 * Find seed URL metadata by URL
 */
export function findSeedMetadata(url) {
  const normalized = normalizeUrl(url);
  return SEED_URLS.find(source => normalizeUrl(source.url) === normalized);
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash, fragments, and normalize
    let normalized = urlObj.origin + urlObj.pathname;
    if (normalized.endsWith('/') && normalized !== urlObj.origin + '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch (e) {
    return url;
  }
}

/**
 * Get freshness threshold for a category
 */
export function getFreshnessThreshold(category) {
  return FRESHNESS_POLICY[category] || FRESHNESS_POLICY.default;
}

/**
 * Check if a URL should be crawled (internal link discovery)
 */
export function shouldCrawlUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Must be HTTPS
    if (urlObj.protocol !== 'https:') return false;
    
    // Must be vaultofcodes.in
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname !== 'vaultofcodes.in' && hostname !== 'www.vaultofcodes.in') {
      return false;
    }
    
    // Exclude common non-content paths
    const path = urlObj.pathname.toLowerCase();
    const excludePatterns = [
      '/cdn-cgi/',
      '/api/',
      '/_next/',
      '/static/',
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.css',
      '.js',
      '.zip',
      '.exe'
    ];
    
    if (excludePatterns.some(pattern => path.includes(pattern))) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}
