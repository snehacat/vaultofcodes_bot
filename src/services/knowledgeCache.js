import { getFreshnessThreshold } from '../config/sourceUrls.js';

/**
 * In-memory knowledge cache
 * Note: In production, this should use a persistent database (Redis, MongoDB, etc.)
 * For Vercel deployment, consider using Vercel KV or external database
 */
class KnowledgeCache {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize cache with static verified data
   */
  initialize() {
    if (this.initialized) return;

    // Note: Static FAQs removed - we rely on dynamic website content only
    // This ensures responses always come from actual website pages
    
    this.initialized = true;
    console.log('[Cache] Initialized - waiting for dynamic content');
  }

  /**
   * Add a static verified document
   */
  addStaticDocument(doc) {
    const document = {
      ...doc,
      sourceType: 'static_verified',
      fetchedAt: new Date().toISOString(),
      lastVerified: new Date().toISOString()
    };
    this.cache.set(doc.id, document);
  }

  /**
   * Add or update a dynamic website document
   */
  addDocument(doc) {
    const document = {
      id: doc.url || doc.id,
      ...doc,
      sourceType: 'dynamic_website',
      lastVerified: new Date().toISOString()
    };
    this.cache.set(document.id, document);
    console.log(`[Cache] Added: ${document.title} (${document.category})`);
  }

  /**
   * Get document by ID
   */
  getDocument(id) {
    return this.cache.get(id);
  }

  /**
   * Search documents by category
   */
  searchByCategory(category) {
    const results = [];
    for (const doc of this.cache.values()) {
      if (doc.category === category) {
        results.push(doc);
      }
    }
    return results;
  }

  /**
   * Search documents by keyword
   */
  searchByKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const results = [];

    for (const doc of this.cache.values()) {
      const searchText = `${doc.title} ${doc.content} ${doc.description || ''}`.toLowerCase();
      if (searchText.includes(lowerKeyword)) {
        results.push(doc);
      }
    }

    return results;
  }

  /**
   * Check if a document is fresh
   */
  isFresh(doc) {
    if (doc.sourceType === 'static_verified') return true;
    if (!doc.lastVerified) return false;

    const lastVerified = new Date(doc.lastVerified);
    const now = new Date();
    const ageHours = (now - lastVerified) / (1000 * 60 * 60);

    const freshnessThreshold = getFreshnessThreshold(doc.category);

    return ageHours < freshnessThreshold;
  }

  /**
   * Get stale documents that need refresh
   */
  getStaleDocuments() {
    const stale = [];
    for (const doc of this.cache.values()) {
      if (doc.sourceType === 'dynamic_website' && !this.isFresh(doc)) {
        stale.push(doc);
      }
    }
    return stale;
  }

  /**
   * Get all documents
   */
  getAllDocuments() {
    return Array.from(this.cache.values());
  }

  /**
   * Get document count
   */
  getCount() {
    return this.cache.size;
  }

  /**
   * Clear dynamic documents (keep static verified data)
   */
  clearDynamic() {
    const toDelete = [];
    for (const [id, doc] of this.cache.entries()) {
      if (doc.sourceType === 'dynamic_website') {
        toDelete.push(id);
      }
    }
    toDelete.forEach(id => this.cache.delete(id));
    console.log(`[Cache] Cleared ${toDelete.length} dynamic documents`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      total: 0,
      static: 0,
      dynamic: 0,
      fresh: 0,
      stale: 0,
      byCategory: {}
    };

    for (const doc of this.cache.values()) {
      stats.total++;
      
      if (doc.sourceType === 'static_verified') {
        stats.static++;
      } else {
        stats.dynamic++;
        if (this.isFresh(doc)) {
          stats.fresh++;
        } else {
          stats.stale++;
        }
      }

      stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
export const knowledgeCache = new KnowledgeCache();

/**
 * Retrieve relevant context for a query
 * @param {string} query - User query
 * @param {string} category - Intent category
 * @returns {Object} Retrieved context
 */
export function retrieveContext(query, category) {
  knowledgeCache.initialize();

  const lowerQuery = query.toLowerCase();
  const context = {
    relevant: true,
    documents: [],
    needsRefresh: false
  };

  // Search by category first
  let docs = knowledgeCache.searchByCategory(category);

  // Also search by keywords in parallel
  const keywords = query.split(' ').filter(w => w.length > 3);
  const keywordDocs = [];
  keywords.forEach(keyword => {
    keywordDocs.push(...knowledgeCache.searchByKeyword(keyword));
  });

  // Combine results
  docs = [...docs, ...keywordDocs];

  // If still no results, get all documents (better than static FAQs)
  if (docs.length === 0) {
    console.log('[Retrieval] No category/keyword match, fetching all documents');
    docs = knowledgeCache.getAllDocuments().filter(doc => 
      doc.sourceType === 'dynamic_website'
    );
  }

  // Deduplicate
  const uniqueDocs = Array.from(new Map(docs.map(d => [d.id, d])).values());

  // Check freshness
  const freshDocs = [];
  const staleDocs = [];

  for (const doc of uniqueDocs) {
    if (knowledgeCache.isFresh(doc)) {
      freshDocs.push(doc);
    } else {
      staleDocs.push(doc);
      context.needsRefresh = true;
    }
  }

  // Prioritize fresh documents, limit to top 5
  context.documents = [...freshDocs, ...staleDocs].slice(0, 5);

  // FALLBACK: If no dynamic documents found, create documents from static knowledge base
  if (context.documents.length === 0) {
    console.log('[Retrieval] No dynamic content, using static knowledge base as fallback');
    context.documents = createStaticDocuments(query, category);
    context.needsRefresh = true;
    context.needsDynamicFetch = true;
  }

  console.log(`[Retrieval] Found ${context.documents.length} documents for "${query}"`);
  if (context.needsRefresh) {
    console.log('[Retrieval] Content may be stale, refresh recommended');
  }

  return context;
}

/**
 * Create documents from static knowledge base (fallback)
 */
function createStaticDocuments(query, category) {
  const lowerQuery = query.toLowerCase();
  
  const staticKnowledgeBase = {
    courses: {
      id: "voc_courses",
      title: "Training & Internship Programs",
      url: "https://www.vaultofcodes.in/courses",
      category: "course",
      content: "VaultOfCodes offers live training programs covering computer science subjects such as programming languages, web development, data science, and more. Expert instructors deliver hands-on sessions with 70% practical and 30% theoretical training.\n\nFeatures:\n• Live training from 10+ years experience experts\n• 70% Practical Training, 30% Theoretical\n• 2 Certificates (Training + Internship completion)\n• 50GB+ Free Study Material\n• Resume building & Interview preparation\n• Real-world projects for portfolio building"
    },
    internships: {
      id: "voc_internship",
      title: "Internships - VaultOfCodes",
      url: "https://www.vaultofcodes.in/courses",
      category: "internship",
      content: "Gain practical experience while learning. Build your portfolio through live projects with VaultOfCodes.\n\nBenefits:\n• Internship completion certificate\n• Training completion certificate\n• Free study materials (50GB+)\n• Resume building support\n• Interview preparation"
    },
    certificates: {
      id: "voc_certificates",
      title: "Certificate Verification",
      url: "https://www.vaultofcodes.in/validate",
      category: "certificate",
      content: "Verify your VaultOfCodes certificates online. Each certificate comes with a unique verification code.\n\nFeatures:\n• Online verification available\n• Unique certificate ID for each student\n• Downloadable certificates\n• Valid and recognized certificates"
    },
    about: {
      id: "voc_about",
      title: "About VaultOfCodes",
      url: "https://www.vaultofcodes.in/about-us",
      category: "general",
      content: "VaultOfCodes is a leading EdTech platform providing quality training and internship programs in computer science and technology.\n\nHighlights:\n• 10+ years of industry experience\n• Thousands of successful students\n• Industry-recognized certifications\n• Expert trainers and mentors"
    },
    contact: {
      id: "voc_contact",
      title: "Contact VaultOfCodes",
      url: "https://www.vaultofcodes.in/contact-us",
      category: "support",
      content: "Get in touch with our support team for any queries or assistance.\n\nContact Methods:\n• WhatsApp: +91 9455345519\n• Email: vaultofcodes@gmail.com\n• Phone: 011-69655581"
    },
    testimonials: {
      id: "voc_testimonials",
      title: "Student Testimonials",
      url: "https://www.vaultofcodes.in/testimonials",
      category: "general",
      content: "Read what our students say about their learning experience at VaultOfCodes. Thousands of satisfied students have successfully completed our programs."
    }
  };

  const documents = [];

  // Match based on query keywords
  if (category === 'certificate' || lowerQuery.includes('certificate') || lowerQuery.includes('verify') || lowerQuery.includes('validation')) {
    documents.push({
      ...staticKnowledgeBase.certificates,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  if (category === 'internship' || lowerQuery.includes('internship')) {
    documents.push({
      ...staticKnowledgeBase.internships,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  if (category === 'course' || lowerQuery.includes('training') || lowerQuery.includes('course') || lowerQuery.includes('program')) {
    documents.push({
      ...staticKnowledgeBase.courses,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  if (category === 'support' || lowerQuery.includes('contact') || lowerQuery.includes('support') || lowerQuery.includes('help')) {
    documents.push({
      ...staticKnowledgeBase.contact,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  if (lowerQuery.includes('about') || lowerQuery.includes('who are') || lowerQuery.includes('company')) {
    documents.push({
      ...staticKnowledgeBase.about,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  if (lowerQuery.includes('testimonial') || lowerQuery.includes('review') || lowerQuery.includes('student') || lowerQuery.includes('feedback')) {
    documents.push({
      ...staticKnowledgeBase.testimonials,
      sourceType: 'static_fallback',
      lastVerified: new Date().toISOString()
    });
  }

  // If no specific match or general query, return relevant documents
  if (documents.length === 0 || category === 'general') {
    documents.push(
      {
        ...staticKnowledgeBase.courses,
        sourceType: 'static_fallback',
        lastVerified: new Date().toISOString()
      },
      {
        ...staticKnowledgeBase.internships,
        sourceType: 'static_fallback',
        lastVerified: new Date().toISOString()
      }
    );
  }

  // Remove duplicates
  const uniqueDocs = Array.from(new Map(documents.map(d => [d.id, d])).values());
  
  return uniqueDocs;
}

/**
 * Format context for LLM prompt
 */
export function formatContextForPrompt(context) {
  if (!context.documents || context.documents.length === 0) {
    return '\n=== NO RELIABLE INFORMATION FOUND ===\nYou must NOT invent information. Tell the user you don\'t have verified information and offer to connect them with support.\n';
  }

  let formatted = '\n=== VERIFIED VAULTOFCODES INFORMATION ===\n';
  formatted += '⚠️ CRITICAL: ALL URLs below use the .in domain (https://www.vaultofcodes.in/), NEVER use .com\n';
  formatted += '⚠️ CRITICAL: You may ONLY use the URLs listed below - DO NOT create or invent any other URLs\n\n';

  // List all available URLs first
  formatted += '📌 AVAILABLE URLS (you may ONLY cite these URLs):\n';
  context.documents.forEach((doc, index) => {
    if (doc.url && doc.url !== 'Static FAQ') {
      formatted += `${index + 1}. ${doc.url}\n`;
    }
  });
  formatted += '\n';

  context.documents.forEach((doc, index) => {
    formatted += `\n━━━ SOURCE ${index + 1} ━━━\n`;
    formatted += `📄 Title: ${doc.title}\n`;
    formatted += `🔗 URL: ${doc.url || 'N/A'}\n`;
    formatted += `📁 Category: ${doc.category}\n`;
    formatted += `📅 Last Verified: ${doc.lastVerified}\n\n`;
    
    // Add full content
    formatted += `📋 CONTENT:\n${doc.content}\n\n`;
    
    // Add headings for structure
    if (doc.headings && doc.headings.length > 0) {
      formatted += `📑 Page Structure:\n`;
      doc.headings.slice(0, 10).forEach(h => {
        formatted += `  ${h.level.toUpperCase()}: ${h.text}\n`;
      });
      formatted += '\n';
    }
    
    // Add description if available
    if (doc.description) {
      formatted += `📝 Description: ${doc.description}\n\n`;
    }
    
    formatted += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  });

  formatted += '\n=== MANDATORY INSTRUCTIONS ===\n';
  formatted += '✅ Use ONLY the information above to answer\n';
  formatted += '✅ ONLY cite URLs that are listed in "AVAILABLE URLS" section above\n';
  formatted += '✅ NEVER create, invent, or make up URLs not shown above\n';
  formatted += '✅ If a URL is not in the list above, it does NOT exist - do not mention it\n';
  formatted += '✅ ALWAYS cite the source URL when providing information\n';
  formatted += '✅ ALL VaultOfCodes URLs use .in domain, NEVER .com\n';
  formatted += '✅ Be specific and detailed - use the actual content provided\n';
  formatted += '❌ DO NOT make up or hallucinate URLs like /training-programs, /how-it-works, etc.\n';
  formatted += '❌ DO NOT invent page names or create URL paths not listed above\n';
  formatted += '❌ DO NOT make up information not present in the content above\n';
  formatted += '❌ If the information is insufficient, say so clearly and offer support escalation\n\n';

  return formatted;
}
