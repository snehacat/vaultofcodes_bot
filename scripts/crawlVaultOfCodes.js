import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.vaultofcodes.in';
const visited = new Set();
const urlDatabase = [];
const maxDepth = 3;

/**
 * Crawl VaultOfCodes website to discover all URLs
 */
async function crawlPage(url, depth = 0) {
  if (depth > maxDepth || visited.has(url)) return;
  
  // Only crawl vaultofcodes.in domain
  if (!url.startsWith(BASE_URL)) return;
  
  visited.add(url);
  console.log(`[Crawling] ${url} (depth: ${depth})`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[Skip] ${url} - Status ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract page information
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().trim().substring(0, 200);

    // Extract main headings
    const headings = [];
    $('h1, h2, h3').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 100) {
        headings.push(text);
      }
    });

    // Extract keywords from content
    const keywords = extractKeywords($, title, headings);

    // Categorize the page
    const category = categorizePage(url, title, keywords);

    // Store page information
    const pageInfo = {
      url,
      title,
      description,
      category,
      keywords,
      headings: headings.slice(0, 5),
      discovered: new Date().toISOString()
    };

    urlDatabase.push(pageInfo);
    console.log(`[Stored] ${title} - ${category}`);

    // Find all internal links
    const links = new Set();
    $('a[href]').each((i, elem) => {
      let href = $(elem).attr('href');
      if (!href) return;

      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = BASE_URL + href;
      } else if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Only add vaultofcodes.in links
      if (href.startsWith(BASE_URL)) {
        // Remove query parameters and fragments for cleaner URLs
        const cleanUrl = href.split('?')[0].split('#')[0];
        links.add(cleanUrl);
      }
    });

    // Crawl discovered links
    for (const link of links) {
      if (!visited.has(link)) {
        await crawlPage(link, depth + 1);
        await sleep(1000); // Rate limiting
      }
    }

  } catch (error) {
    console.error(`[Error] ${url}: ${error.message}`);
  }
}

/**
 * Extract keywords from page content
 */
function extractKeywords($, title, headings) {
  const keywords = new Set();
  
  // Keywords from title
  const titleWords = title.toLowerCase().match(/\b\w{4,}\b/g) || [];
  titleWords.forEach(w => keywords.add(w));

  // Keywords from headings
  headings.forEach(h => {
    const words = h.toLowerCase().match(/\b\w{4,}\b/g) || [];
    words.forEach(w => keywords.add(w));
  });

  // Common course/internship keywords
  const commonKeywords = [
    'python', 'java', 'javascript', 'web', 'development', 'data', 'science',
    'machine', 'learning', 'artificial', 'intelligence', 'ai', 'ml',
    'internship', 'course', 'training', 'certificate', 'program',
    'frontend', 'backend', 'fullstack', 'android', 'ios', 'mobile',
    'cloud', 'devops', 'cyber', 'security', 'blockchain', 'react', 'angular', 'node'
  ];

  const pageText = $('body').text().toLowerCase();
  commonKeywords.forEach(keyword => {
    if (pageText.includes(keyword)) {
      keywords.add(keyword);
    }
  });

  return Array.from(keywords);
}

/**
 * Categorize page based on URL and content
 */
function categorizePage(url, title, keywords) {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  const keywordStr = keywords.join(' ').toLowerCase();

  // Specific course pages
  if (urlLower.match(/\/courses\/\d+/)) {
    if (keywordStr.includes('python') || titleLower.includes('python')) return 'course-python-specific';
    if (keywordStr.includes('web') || titleLower.includes('web')) return 'course-web-specific';
    if (keywordStr.includes('java') && !keywordStr.includes('javascript')) return 'course-java-specific';
    if (keywordStr.includes('data') || keywordStr.includes('science')) return 'course-data-specific';
    if (keywordStr.includes('ai') || keywordStr.includes('machine') || keywordStr.includes('learning')) return 'course-ai-specific';
    if (keywordStr.includes('android')) return 'course-android-specific';
    if (keywordStr.includes('ios')) return 'course-ios-specific';
    return 'course-specific';
  }

  // General courses page
  if (urlLower.includes('/course') || titleLower.includes('course') || keywordStr.includes('course')) {
    if (keywordStr.includes('python')) return 'course-python';
    if (keywordStr.includes('java')) return 'course-java';
    if (keywordStr.includes('web') || keywordStr.includes('javascript')) return 'course-web';
    if (keywordStr.includes('data') || keywordStr.includes('science')) return 'course-data';
    if (keywordStr.includes('machine') || keywordStr.includes('learning') || keywordStr.includes('ai')) return 'course-ai';
    return 'courses';
  }

  // Internships page
  if (urlLower.includes('/internship') || titleLower.includes('internship') || keywordStr.includes('internship')) {
    if (keywordStr.includes('python')) return 'internship-python';
    if (keywordStr.includes('java')) return 'internship-java';
    if (keywordStr.includes('web')) return 'internship-web';
    if (keywordStr.includes('data')) return 'internship-data';
    if (keywordStr.includes('ai') || keywordStr.includes('ml')) return 'internship-ai';
    return 'internships';
  }

  if (urlLower.includes('/certificate') || urlLower.includes('/validate') || titleLower.includes('certificate')) {
    return 'certificate-verification';
  }

  if (urlLower.includes('/contact') || titleLower.includes('contact')) {
    return 'contact';
  }

  if (urlLower.includes('/about') || titleLower.includes('about')) {
    return 'about';
  }

  if (urlLower.includes('/free-content') || titleLower.includes('free content') || (urlLower.includes('/free') && keywordStr.includes('content'))) {
    return 'free-content';
  }

  if (urlLower.includes('/testimonial') || titleLower.includes('testimonial') || titleLower.includes('review')) {
    return 'testimonials';
  }

  if (urlLower.includes('/faq') || titleLower.includes('faq')) {
    return 'faq';
  }

  if (urlLower.includes('/freetest') || titleLower.includes('free test')) {
    return 'free-tests';
  }

  if (urlLower.includes('/login') || urlLower.includes('/signin')) {
    return 'login';
  }

  if (urlLower.includes('/register') || urlLower.includes('/signup') || urlLower.includes('/enroll')) {
    return 'registration';
  }

  if (urlLower === BASE_URL || urlLower === BASE_URL + '/') {
    return 'home';
  }

  return 'other';
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Save URL database to JSON file
 */
function saveDatabase() {
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'urlMap.json');
  
  // Sort by category and title
  const sorted = urlDatabase.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });

  const output = {
    crawled_at: new Date().toISOString(),
    base_url: BASE_URL,
    total_pages: sorted.length,
    pages: sorted
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n[Success] Saved ${sorted.length} URLs to ${outputPath}`);

  // Generate markdown report
  generateReport(sorted);
}

/**
 * Generate markdown report
 */
function generateReport(pages) {
  const reportPath = path.join(__dirname, '..', 'vaultofcodes_urls.md');
  
  let markdown = `# VaultOfCodes Website URL Map\n\n`;
  markdown += `**Crawled:** ${new Date().toISOString()}\n`;
  markdown += `**Total Pages:** ${pages.length}\n\n`;
  markdown += `---\n\n`;

  // Group by category
  const categories = {};
  pages.forEach(page => {
    if (!categories[page.category]) {
      categories[page.category] = [];
    }
    categories[page.category].push(page);
  });

  // Write each category
  Object.keys(categories).sort().forEach(category => {
    markdown += `## ${category.toUpperCase().replace(/-/g, ' ')}\n\n`;
    markdown += `| Page Title | URL | Keywords |\n`;
    markdown += `|------------|-----|----------|\n`;
    
    categories[category].forEach(page => {
      const keywords = page.keywords.slice(0, 5).join(', ');
      markdown += `| ${page.title} | [${page.url}](${page.url}) | ${keywords} |\n`;
    });
    
    markdown += `\n`;
  });

  fs.writeFileSync(reportPath, markdown);
  console.log(`[Success] Generated report: ${reportPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting VaultOfCodes website crawler...\n');
  
  // Start crawling from homepage
  await crawlPage(BASE_URL);
  
  // Also crawl common pages directly
  const commonPages = [
    '/courses',
    '/internships',
    '/about-us',
    '/contact-us',
    '/testimonials',
    '/validate',
    '/freetest',
    '/free-content',
    // Specific course pages (if they exist)
    '/courses/506722', // Python course
    '/courses/506813', // Web Development course
    '/courses/506814',
    '/courses/506815',
    '/courses/506816',
    '/courses/506817',
    '/courses/506818',
    '/courses/506819',
    '/courses/506820'
  ];

  for (const page of commonPages) {
    const url = BASE_URL + page;
    if (!visited.has(url)) {
      await crawlPage(url, 0);
      await sleep(1000);
    }
  }

  // Save results
  saveDatabase();
}

main().catch(console.error);
