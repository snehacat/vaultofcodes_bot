/**
 * Trusted Source Configuration
 * Only these domains are allowed for dynamic content fetching
 */

export const TRUSTED_DOMAINS = [
  'vaultofcodes.in',
  'www.vaultofcodes.in'
];

export const BASE_URL = 'https://www.vaultofcodes.in';

/**
 * Priority keywords for page discovery
 * Pages containing these terms are prioritized for crawling
 */
export const PRIORITY_KEYWORDS = [
  'course',
  'courses',
  'internship',
  'internships',
  'training',
  'workshop',
  'certificate',
  'verification',
  'offer-letter',
  'offer',
  'faq',
  'support',
  'contact',
  'about'
];

/**
 * Freshness policy - how often to refresh content (in hours)
 */
export const FRESHNESS_HOURS = {
  internship: 12,      // Internships change frequently
  course: 24,          // Courses updated daily
  training: 24,        // Training programs updated daily
  faq: 24,             // FAQs updated regularly
  certificate: 48,     // Certificate info relatively stable
  workshop: 12,        // Workshops are time-sensitive
  about: 168,          // About page rarely changes (7 days)
  support: 24,         // Support info should be fresh
  default: 48          // Default refresh interval
};

/**
 * Crawler limits
 */
export const CRAWLER_CONFIG = {
  maxPagesPerCrawl: 20,
  maxResponseSize: 1024 * 1024, // 1MB
  timeout: 10000, // 10 seconds
  requestDelay: 1000, // 1 second between requests
  userAgent: 'VaultOfCodes-SupportBot/1.0'
};

/**
 * Content extraction rules
 */
export const CONTENT_RULES = {
  // HTML elements to remove (noise)
  removeSelectors: [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.cookie-banner',
    '.advertisement',
    '#social-media',
    '.breadcrumb'
  ],
  // HTML elements to prioritize (signal)
  prioritizeSelectors: [
    'main',
    'article',
    '.content',
    '.course-info',
    '.internship-details',
    'h1',
    'h2',
    'h3',
    'p',
    'ul',
    'ol'
  ]
};

/**
 * Validate if a URL belongs to a trusted domain
 */
export function isTrustedDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Validate if a URL is safe to fetch
 */
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') return false;
    // Check trusted domain
    if (!isTrustedDomain(url)) return false;
    // Exclude common non-content files
    const path = urlObj.pathname.toLowerCase();
    const excludeExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.zip', '.exe'];
    if (excludeExtensions.some(ext => path.endsWith(ext))) return false;
    return true;
  } catch (error) {
    return false;
  }
}
