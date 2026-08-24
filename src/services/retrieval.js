import knowledgeBase from '../data/knowledgeBase.json';

/**
 * Simple keyword-based retrieval from knowledge base
 * @param {string} query - User's query
 * @param {string} intent - Detected intent
 * @returns {Object} Retrieved context
 */
export function retrieveContext(query, intent) {
  const lowerQuery = query.toLowerCase();
  const context = {
    relevant: true,
    data: [],
    pages: knowledgeBase.pages
  };
  
  try {
    switch (intent) {
      case 'course_inquiry':
      case 'training_inquiry':
        context.data = retrieveCourses(lowerQuery);
        if (intent === 'training_inquiry') {
          context.data.push(...knowledgeBase.training_programs);
        }
        break;
        
      case 'internship_inquiry':
        context.data = knowledgeBase.internships;
        context.relevant_faqs = filterFAQs('internship');
        break;
        
      case 'workshop_inquiry':
        context.data = knowledgeBase.workshops;
        break;
        
      case 'certificate_query':
      case 'certificate_verification':
        context.relevant_faqs = filterFAQs('certificate');
        context.verification_url = knowledgeBase.pages.certificate_verification;
        break;
        
      case 'offer_letter_query':
        context.relevant_faqs = filterFAQs('offer_letter');
        context.dashboard_url = knowledgeBase.pages.dashboard;
        break;
        
      case 'enrollment_query':
        context.relevant_faqs = filterFAQs('enrollment');
        context.enrollment_url = knowledgeBase.pages.enrollment;
        break;
        
      case 'payment_query':
        context.relevant_faqs = filterFAQs('payment');
        context.requires_human = true;
        break;
        
      case 'website_navigation':
        context.pages = knowledgeBase.pages;
        context.all_faqs = knowledgeBase.faqs;
        break;
        
      case 'general_query':
        context.all_faqs = knowledgeBase.faqs;
        context.data = [...knowledgeBase.courses, ...knowledgeBase.internships];
        break;
        
      default:
        context.relevant = false;
        context.all_faqs = knowledgeBase.faqs;
    }
    
    return context;
    
  } catch (error) {
    console.error('Retrieval error:', error);
    return {
      relevant: false,
      error: true,
      pages: knowledgeBase.pages
    };
  }
}

/**
 * Retrieve courses matching the query
 */
function retrieveCourses(query) {
  return knowledgeBase.courses.filter(course => {
    const searchText = `${course.name} ${course.category} ${course.description}`.toLowerCase();
    const keywords = query.split(' ').filter(w => w.length > 3);
    return keywords.some(keyword => searchText.includes(keyword));
  });
}

/**
 * Filter FAQs by category
 */
function filterFAQs(category) {
  return knowledgeBase.faqs.filter(faq => 
    faq.category === category || 
    faq.question.toLowerCase().includes(category)
  );
}

/**
 * Search for relevant page URLs based on query
 */
export function findRelevantPage(query) {
  const lowerQuery = query.toLowerCase();
  const pages = knowledgeBase.pages;
  
  if (lowerQuery.match(/course/)) return pages.courses;
  if (lowerQuery.match(/internship/)) return pages.internships;
  if (lowerQuery.match(/workshop/)) return pages.workshops;
  if (lowerQuery.match(/training/)) return pages.training;
  if (lowerQuery.match(/verif.*certificate/)) return pages.certificate_verification;
  if (lowerQuery.match(/dashboard|account|profile/)) return pages.dashboard;
  if (lowerQuery.match(/enroll|register/)) return pages.enrollment;
  if (lowerQuery.match(/contact|support/)) return pages.support;
  if (lowerQuery.match(/about/)) return pages.about;
  
  return null;
}

/**
 * Format context for LLM prompt
 */
export function formatContextForPrompt(context) {
  let formatted = '\n\n=== KNOWLEDGE BASE CONTEXT ===\n';
  
  if (context.data && context.data.length > 0) {
    formatted += '\nRelevant Information:\n';
    formatted += JSON.stringify(context.data, null, 2);
  }
  
  if (context.relevant_faqs && context.relevant_faqs.length > 0) {
    formatted += '\n\nRelevant FAQs:\n';
    context.relevant_faqs.forEach(faq => {
      formatted += `Q: ${faq.question}\nA: ${faq.answer}\n`;
      if (faq.url) formatted += `Link: ${faq.url}\n`;
      formatted += '\n';
    });
  }
  
  if (context.pages) {
    formatted += '\nAvailable Pages:\n';
    formatted += JSON.stringify(context.pages, null, 2);
  }
  
  formatted += '\n=== END CONTEXT ===\n\n';
  formatted += 'IMPORTANT: Use ONLY the information provided above. If information is marked as PLACEHOLDER or not available, clearly state that you don\'t have specific details.\n\n';
  
  return formatted;
}
