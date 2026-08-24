import React from 'react';

function Message({ message, onWhatsAppClick }) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    const content = message.content;

    // First, handle markdown-style links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    let processedContent = content.replace(markdownLinkRegex, (match, text, url) => {
      return `__MDLINK__${text}__MDURL__${url}__ENDMDLINK__`;
    });

    // Then handle standalone URLs
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const parts = processedContent.split(/(__MDLINK__.*?__ENDMDLINK__|https?:\/\/[^\s\)]+)/g);

    return parts.map((part, index) => {
      // Handle markdown-style links
      if (part.startsWith('__MDLINK__')) {
        const linkMatch = part.match(/__MDLINK__(.+?)__MDURL__(.+?)__ENDMDLINK__/);
        if (linkMatch) {
          const [, text, url] = linkMatch;
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isUser ? 'text-white underline hover:text-red-100' : 'text-red-300 hover:text-red-200 underline'} font-medium inline-flex items-center gap-1`}
            >
              {text}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          );
        }
      }

      // Handle standalone URLs
      if (/^https?:\/\//.test(part)) {
        let cleanUrl = part;
        let trailingPunctuation = '';
        
        const punctuationMatch = part.match(/([.,;:!?\)]*)$/);
        if (punctuationMatch && punctuationMatch[1]) {
          trailingPunctuation = punctuationMatch[1];
          cleanUrl = part.slice(0, -trailingPunctuation.length);
        }
        
        return (
          <React.Fragment key={index}>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isUser ? 'text-white underline hover:text-red-100' : 'text-red-300 hover:text-red-200 underline'} font-medium break-all`}
            >
              {cleanUrl}
            </a>
            {trailingPunctuation}
          </React.Fragment>
        );
      }

      return <span key={index} className="text-white">{part}</span>;
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] rounded-2xl p-3 sm:p-4 ${
        isUser 
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white rounded-br-sm shadow-lg' 
          : 'bg-slate-700 text-white rounded-bl-sm border border-white/10'
      }`}>
        {/* Message Content */}
        <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-white">
          {renderContent()}
        </div>

        {/* Exact URL Match - Prominent Display */}
        {!isUser && message.exactURL && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-red-300 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Exact Page Match
              </p>
              {message.exactURL.realtime && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Real-time
                </span>
              )}
            </div>
            <a
              href={message.exactURL.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 p-3 rounded-lg transition-all group"
            >
              <div className="flex-1">
                <p className="text-white font-semibold text-sm sm:text-base">{message.exactURL.title}</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 break-all">{message.exactURL.url}</p>
              </div>
              <svg className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            {message.exactURL.confidence && (
              <p className="text-xs text-gray-500 mt-2">
                Match confidence: {(message.exactURL.confidence * 100).toFixed(0)}% • Type: {message.exactURL.matchType}
              </p>
            )}
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs sm:text-sm text-gray-200 font-semibold mb-2">📚 Sources:</p>
            <div className="space-y-1">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs sm:text-sm text-red-300 hover:text-red-200 hover:underline"
                >
                  <span>•</span>
                  <span>{source.title}</span>
                </a>
              ))}
            </div>
            {message.freshlyFetched && (
              <p className="text-xs sm:text-sm text-green-300 mt-2">✅ Fresh information from website</p>
            )}
          </div>
        )}

        {/* WhatsApp Support Button */}
        {message.requiresHuman && (
          <button
            onClick={onWhatsAppClick}
            className="mt-3 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm sm:text-base shadow-lg hover:shadow-green-500/50"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contact Support on WhatsApp
          </button>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className={`text-xs mt-2 ${isUser ? 'text-red-100' : 'text-gray-300'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
