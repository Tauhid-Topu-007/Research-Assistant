import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

function ChatInterface({ onAsk, isLoading, messages, onHighlightClick, paperTitle }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onAsk(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Welcome message */}
      {(!messages || messages.length === 0) && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800">Ask About This Paper</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              Ask questions about the content, methodology, results, or any specific section of the paper.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs bg-gray-100 rounded-lg p-2 text-gray-600">
                💡 "What is the main contribution of this paper?"
              </div>
              <div className="text-xs bg-gray-100 rounded-lg p-2 text-gray-600">
                💡 "Explain the methodology used."
              </div>
              <div className="text-xs bg-gray-100 rounded-lg p-2 text-gray-600">
                💡 "What datasets were used in the experiments?"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages && messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Sources / Highlights */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 mb-1">📖 Sources:</p>
                    {message.sources.map((source, idx) => (
                      <button
                        key={idx}
                        onClick={() => onHighlightClick(source.page, source.bbox)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline block mt-1"
                      >
                        Page {source.page} - {source.text?.substring(0, 50)}...
                      </button>
                    ))}
                  </div>
                )}
                
                {message.timestamp && (
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse">Thinking</div>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={paperTitle ? `Ask about "${paperTitle}"...` : "Ask a question..."}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length > 0 && `${input.length} characters`}
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-1 h-12"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}

export default ChatInterface;