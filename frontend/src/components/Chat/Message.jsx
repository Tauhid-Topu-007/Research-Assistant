import React, { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Message = ({ message, onHighlightClick }) => {
  const [showSources, setShowSources] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-sm font-medium text-gray-600">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            isUser ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
        </div>

        {/* Message Content */}
        <div className={`px-4 py-2 rounded-2xl ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Sources */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-300">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <DocumentTextIcon className="h-4 w-4" />
                {showSources ? 'Hide sources' : `Show ${message.sources.length} source(s)`}
              </button>
              
              {showSources && (
                <div className="mt-2 space-y-1">
                  {message.sources.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() => onHighlightClick && onHighlightClick(source.page, source.bbox)}
                      className="block w-full text-left text-xs bg-white bg-opacity-50 hover:bg-opacity-100 px-2 py-1 rounded transition"
                    >
                      <span className="font-medium text-blue-600">Page {source.page}:</span>
                      <span className="text-gray-700 ml-1">
                        {source.text?.substring(0, 80)}...
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default Message;