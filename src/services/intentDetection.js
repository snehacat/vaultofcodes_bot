import { INTENT_CLASSIFICATION_PROMPT } from '../data/systemPrompt';

/**
 * Detects the intent of a user query
 * @param {string} query - User's message
 * @returns {Promise<Object>} Intent classification result
 */
export async function detectIntent(query) {
  try {
    // Simple rule-based intent detection for reliability
    const lowerQuery = query.toLowerCase();
    
    // Certificate verification patterns
    if (lowerQuery.match(/verif(y|ication)|check.*certificate|validate.*certificate/)) {
      return {
        intent: 'certificate_verification',
        confidence: 0.95,
        requires_human: false
      };
    }
    
    // Certificate query patterns
    if (lowerQuery.match(/certificate|cert\b/)) {
      return {
        intent: 'certificate_query',
        confidence: 0.90,
        requires_human: false
      };
    }
    
    // Offer letter patterns
    if (lowerQuery.match(/offer\s*letter/)) {
      return {
        intent: 'offer_letter_query',
        confidence: 0.95,
        requires_human: false
      };
    }
    
    // Course patterns
    if (lowerQuery.match(/course|class|training/)) {
      if (lowerQuery.match(/training\s*program/)) {
        return {
          intent: 'training_inquiry',
          confidence: 0.90,
          requires_human: false
        };
      }
      return {
        intent: 'course_inquiry',
        confidence: 0.90,
        requires_human: false
      };
    }
    
    // Internship patterns
    if (lowerQuery.match(/internship|intern\b/)) {
      return {
        intent: 'internship_inquiry',
        confidence: 0.95,
        requires_human: false
      };
    }
    
    // Workshop patterns
    if (lowerQuery.match(/workshop/)) {
      return {
        intent: 'workshop_inquiry',
        confidence: 0.95,
        requires_human: false
      };
    }
    
    // Payment patterns
    if (lowerQuery.match(/payment|pay|fee|refund|price|cost/)) {
      return {
        intent: 'payment_query',
        confidence: 0.90,
        requires_human: lowerQuery.match(/refund|issue|problem/) !== null
      };
    }
    
    // Enrollment patterns
    if (lowerQuery.match(/enroll|register|signup|join/)) {
      return {
        intent: 'enrollment_query',
        confidence: 0.90,
        requires_human: false
      };
    }
    
    // Navigation patterns
    if (lowerQuery.match(/where|find|page|link|url|navigate|go to/)) {
      return {
        intent: 'website_navigation',
        confidence: 0.85,
        requires_human: false
      };
    }
    
    // Human support patterns
    if (lowerQuery.match(/human|person|speak|talk|representative|support team|help me/)) {
      return {
        intent: 'human_support',
        confidence: 0.95,
        requires_human: true
      };
    }
    
    // Technical support patterns
    if (lowerQuery.match(/error|bug|broken|not working|can't|cannot|issue|problem|login|access/)) {
      return {
        intent: 'technical_support',
        confidence: 0.85,
        requires_human: true
      };
    }
    
    // General query
    if (lowerQuery.match(/what is|about|tell me/)) {
      return {
        intent: 'general_query',
        confidence: 0.75,
        requires_human: false
      };
    }
    
    // Default to general query for VaultOfCodes related, unknown otherwise
    if (lowerQuery.match(/vaultofcodes|vault of codes|voc/)) {
      return {
        intent: 'general_query',
        confidence: 0.70,
        requires_human: false
      };
    }
    
    return {
      intent: 'unknown',
      confidence: 0.50,
      requires_human: false
    };
    
  } catch (error) {
    console.error('Intent detection error:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      requires_human: false,
      error: true
    };
  }
}

/**
 * Determines if a query requires human support
 * @param {Object} intentResult - Intent classification result
 * @param {string} query - Original query
 * @returns {boolean}
 */
export function requiresHumanSupport(intentResult, query) {
  if (intentResult.requires_human) return true;
  
  const lowerQuery = query.toLowerCase();
  
  // Additional patterns that require human support
  const humanRequiredPatterns = [
    /refund/,
    /complaint/,
    /dispute/,
    /wrong.*certificate/,
    /incorrect.*certificate/,
    /missing.*certificate/,
    /certificate.*error/,
    /offer.*letter.*issue/,
    /not.*received/,
    /can'?t.*access/,
    /account.*problem/,
    /billing.*issue/
  ];
  
  return humanRequiredPatterns.some(pattern => pattern.test(lowerQuery));
}
