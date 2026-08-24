import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from '../data/systemPrompt.js';

/**
 * Call AI service to get response
 * @param {Array} messages - Conversation history
 * @param {Object} context - Retrieved context from knowledge base
 * @returns {Promise<Object>} AI response with sources
 */
export async function getAIResponse(messages, context) {
  try {
    // Check for API key
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('No API key found in environment variables');
      throw new Error('AI service not configured. Please add GROQ_API_KEY to your .env file.');
    }

    // Initialize Groq client
    const groq = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true // Only for development
    });

    // Build conversation messages
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add context if provided
    if (context && context.formatted) {
      conversationMessages.push({
        role: 'system',
        content: context.formatted
      });
    }

    // Add exact URL context if found
    if (context && context.exactURL) {
      const urlContext = `\n\n=== EXACT URL MATCH ===\n`;
      const url = context.exactURL;
      conversationMessages.push({
        role: 'system',
        content: `${urlContext}For this query, the most relevant verified VaultOfCodes page is:\n📍 **${url.title}**\n🔗 URL: ${url.url}\n\nYou MUST include this specific URL in your response. This is the exact page the user needs.`
      });
    }

    // Add conversation history
    conversationMessages.push(...messages);

    // Call Groq API (without tool calling as groq/compound-mini doesn't support it)
    const completion = await groq.chat.completions.create({
      messages: conversationMessages,
      model: 'groq/compound-mini',
      temperature: 0.3,
      max_tokens: 800,
      top_p: 1,
      stream: false
    });

    const aiMessage = completion.choices[0]?.message;
    
    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Get response
    let response = aiMessage.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    // Safety filters
    response = response.replace(/vaultofcodes\.com/gi, 'vaultofcodes.in');
    response = validateAndCleanUrls(response);

    // Extract sources from context
    const sources = extractSources(context);

    return {
      response,
      sources,
      freshlyfetched: context?.freshlyFetched || false,
      warning: context?.warning || null
    };

  } catch (error) {
    console.error('AI Service error:', error);
    
    // Handle specific errors
    if (error.message?.includes('API key') || error.message?.includes('401')) {
      throw new Error('API key is invalid or not configured properly. Please check your .env file.');
    }

    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      throw new Error('Too many requests. Please try again in a moment.');
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw new Error(error.message || 'An error occurred while processing your request.');
  }
}

/**
 * Validate and clean URLs in response
 */
function validateAndCleanUrls(response) {
  const urlPattern = /https?:\/\/(?:www\.)?vaultofcodes\.in\/[^\s\)"\]]+/gi;
  const urlsInResponse = response.match(urlPattern) || [];
  
  const validUrlPatterns = [
    { exact: 'https://www.vaultofcodes.in/' },
    { exact: 'https://www.vaultofcodes.in/about-us' },
    { exact: 'https://www.vaultofcodes.in/contact-us' },
    { exact: 'https://www.vaultofcodes.in/internships' },
    { exact: 'https://www.vaultofcodes.in/validate' },
    { exact: 'https://www.vaultofcodes.in/free-content' },
    { exact: 'https://www.vaultofcodes.in/testimonials' },
    { prefix: 'https://www.vaultofcodes.in/wlp/' },
    { prefix: 'https://www.vaultofcodes.in/courses/' }
  ];

  for (const url of urlsInResponse) {
    const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
    
    const isValid = validUrlPatterns.some(pattern => {
      if (pattern.exact) {
        return normalizedUrl === pattern.exact.toLowerCase().replace(/\/$/, '');
      } else if (pattern.prefix) {
        return normalizedUrl.startsWith(pattern.prefix.toLowerCase());
      }
      return false;
    });
    
    if (!isValid) {
      console.warn(`[AI Service] Detected hallucinated URL: ${url}`);
      response = response.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'the VaultOfCodes website');
    }
  }
  
  return response;
}

/**
 * Extract sources from context
 */
function extractSources(context, additionalUrls = []) {
  const sources = [];
  
  if (context && context.context && context.context.documents) {
    context.context.documents.forEach(doc => {
      if (doc.url) {
        sources.push({
          title: doc.title,
          url: doc.url,
          lastVerified: doc.lastVerified
        });
      }
    });
  }
  
  // Add any additional URLs from function calling
  additionalUrls.forEach(url => {
    if (!sources.find(s => s.url === url)) {
      sources.push({
        title: 'VaultOfCodes Page',
        url: url,
        lastVerified: new Date().toISOString()
      });
    }
  });
  
  return sources;
}
