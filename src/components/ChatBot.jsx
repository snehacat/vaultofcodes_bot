import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import SuggestedQuestions from './SuggestedQuestions';
import ChatInput from './ChatInput';
import { detectIntent, requiresHumanSupport } from '../services/intentDetection';
import { dynamicRetrieve, initializeKnowledgeBase } from '../services/dynamicRetrieval';
import { getAIResponse } from '../services/aiService';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "👋 Hello! I'm your VaultOfCodes AI Assistant!\n\n💡 I can help you with:\n\n🎓 **Training & Courses** - Explore our programs\n💼 **Internships** - Learn about opportunities\n📜 **Certificates** - Verification & downloads\n📚 **Study Materials** - Free resources & content\n✅ **Enrollment** - How to get started\n\nJust ask me anything, and I'll fetch the latest information from our official website!",
  timestamp: new Date().toISOString()
};

const SUGGESTED_QUESTIONS = [
  { icon: '🎓', text: 'Training Programs', query: 'What training programs do you offer?' },
  { icon: '💼', text: 'Internships', query: 'Tell me about your internship opportunities' },
  { icon: '📜', text: 'Get Certificate', query: 'How can I download my certificate?' },
  { icon: '📚', text: 'Study Materials', query: 'What free study materials are available?' },
  { icon: '🎯', text: 'Course Details', query: 'What courses can I enroll in?' },
  { icon: '📞', text: 'Contact Support', query: 'How do I contact VaultOfCodes support?' }
];

const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_SUPPORT_URL || 'PLACEHOLDER_WHATSAPP_URL';

function ChatBot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize knowledge base on app startup
  useEffect(() => {
    const initKB = async () => {
      console.log('[ChatBot] Initializing knowledge base...');
      try {
        const result = await initializeKnowledgeBase();
        console.log('[ChatBot] Knowledge base initialized:', result);
        setIsInitializing(false);
      } catch (error) {
        console.error('[ChatBot] Failed to initialize knowledge base:', error);
        setIsInitializing(false); // Continue anyway, will fetch on-demand
      }
    };
    initKB();
  }, []); // Run once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Step 1: Intent Detection
      const intentResult = await detectIntent(userMessage);
      console.log('[ChatBot] Intent:', intentResult);

      // Step 2: Check if human support is required
      if (requiresHumanSupport(intentResult, userMessage)) {
        const supportMessage = {
          role: 'assistant',
          content: "This requires our support team's assistance. Please contact us on WhatsApp and our team will help you.",
          timestamp: new Date().toISOString(),
          requiresHuman: true,
          whatsappUrl: WHATSAPP_URL
        };
        setMessages(prev => [...prev, supportMessage]);
        setIsLoading(false);
        return;
      }

      // Step 3: Real-time URL Search (PRIMARY METHOD)
      console.log('[ChatBot] 🔍 Searching website in real-time...');
      let urlMatch = null;
      
      try {
        const { searchWebsiteRealtime } = await import('../services/realtimeUrlSearch.js');
        urlMatch = await searchWebsiteRealtime(userMessage, intentResult.intent);
        
        if (urlMatch) {
          console.log('[ChatBot] ✓ Real-time search found URL:', urlMatch.url);
        } else {
          console.log('[ChatBot] ✗ Real-time search found no URL, trying static database...');
        }
      } catch (realtimeError) {
        console.warn('[ChatBot] Real-time search failed, falling back to static:', realtimeError.message);
      }

      // Step 4: Fallback to static URL database if real-time didn't find anything
      if (!urlMatch) {
        console.log('[ChatBot] 📚 Searching static URL database...');
        try {
          const { findExactURL } = await import('../services/urlMatcher.js');
          urlMatch = findExactURL(userMessage, intentResult.intent);
          
          if (urlMatch) {
            console.log('[ChatBot] ✓ Static database found URL:', urlMatch.url);
            urlMatch.realtime = false; // Mark as static result
          }
        } catch (staticError) {
          console.warn('[ChatBot] Static database search also failed:', staticError.message);
        }
      }

      // Step 5: Retrieve context using dynamic retrieval
      const retrievalResult = await dynamicRetrieve(userMessage, intentResult.intent);
      console.log('[ChatBot] Retrieval result:', retrievalResult);

      // Step 6: Call AI API with retrieved context AND exact URL
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .slice(-6) // Keep last 6 messages for context
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      conversationHistory.push({ role: 'user', content: userMessage });

      // Enhance retrieval result with exact URL if found
      if (urlMatch) {
        retrievalResult.exactURL = urlMatch;
        console.log('[ChatBot] Passing URL to AI:', urlMatch.url, '| Real-time:', urlMatch.realtime);
      }

      const aiResult = await getAIResponse(conversationHistory, retrievalResult);

      const assistantMessage = {
        role: 'assistant',
        content: aiResult.response,
        timestamp: new Date().toISOString(),
        sources: aiResult.sources || [],
        exactURL: urlMatch || null,
        freshlyFetched: aiResult.freshlyFetched || urlMatch?.realtime || false,
        warning: aiResult.warning || null
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('[ChatBot] Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm experiencing technical difficulties. Please try again in a moment or contact our support team on WhatsApp for assistance.",
        timestamp: new Date().toISOString(),
        requiresHuman: true,
        whatsappUrl: WHATSAPP_URL
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (query) => {
    handleSendMessage(query);
  };

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowSuggestions(true);
  };

  const handleWhatsAppSupport = () => {
    if (WHATSAPP_URL && !WHATSAPP_URL.includes('PLACEHOLDER')) {
      window.open(WHATSAPP_URL, '_blank');
    } else {
      alert('WhatsApp support URL not configured. Please contact your administrator.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[95vh] sm:h-[90vh] animate-fade-in border border-white/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-2xl sm:text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-2xl">VaultOfCodes AI</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs sm:text-sm text-red-100">Online • Ready to help</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all hover:rotate-90"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-slate-800/50 custom-scrollbar"
        >
          {messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              onWhatsAppClick={handleWhatsAppSupport}
            />
          ))}

          {showSuggestions && messages.length === 1 && (
            <SuggestedQuestions
              questions={SUGGESTED_QUESTIONS}
              onQuestionClick={handleSuggestedQuestion}
            />
          )}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-slate-700 rounded-lg p-3 max-w-[85%]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-slate-900 p-3 sm:p-6 rounded-b-xl sm:rounded-b-2xl">
          <ChatInput
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
