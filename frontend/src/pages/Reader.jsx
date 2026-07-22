import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { getPaper, getPaperChunks, askQuestion, createHighlight, getPaperHighlights, summarizePaper } from '../services/api';
import toast from 'react-hot-toast';

// Import react-pdf styles for text layer and annotations
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function Reader() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [highlights, setHighlights] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const containerRef = useRef();

  // Fetch paper data
  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ['paper', paperId],
    queryFn: () => getPaper(paperId),
    onError: (error) => {
      toast.error('Failed to load paper: ' + error.message);
    }
  });

  // Fetch chunks
  const { data: chunks } = useQuery({
    queryKey: ['chunks', paperId],
    queryFn: () => getPaperChunks(paperId),
    enabled: !!paperId,
  });

  // Fetch existing highlights
  const { data: existingHighlights } = useQuery({
    queryKey: ['highlights', paperId],
    queryFn: () => getPaperHighlights(paperId),
    enabled: !!paperId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setHighlights(prev => [...prev, ...data]);
      }
    }
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: ({ question }) => askQuestion(question, [parseInt(paperId)]),
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.results && data.results[0]) {
        const result = data.results[0];
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.answer || 'No answer generated',
          sources: result.sources || [],
          timestamp: new Date().toISOString()
        }]);
        
        const sources = result.sources || [];
        const newHighlights = sources.map(source => ({
          page: source.page || 1,
          bbox: source.bbox || [0, 0, 100, 100],
          text: source.text || '',
          color: '#FFD700',
          type: 'ai',
          source: true
        }));
        
        setHighlights(prev => [...prev, ...newHighlights]);
        toast.success('Answer received with highlights!');
      }
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error('Failed to get answer: ' + error.message);
    }
  });

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: () => summarizePaper(parseInt(paperId), 800),
    onSuccess: (data) => {
      setIsSummarizing(false);
      console.log('Summary received:', data);
      
      if (data.summary && data.summary.length > 10) {
        // Store summary data
        setSummaryData(data);
        setShowSummary(true);
        
        // Add summary message to chat
        const summaryMessage = `📝 **Summary of "${data.title || paper?.title || 'Paper'}"**\n\n${data.summary}`;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: summaryMessage,
          sources: data.sources || [],
          timestamp: new Date().toISOString(),
          isSummary: true
        }]);
        
        // Create highlights from sources
        const sources = data.sources || [];
        const newHighlights = sources.map(source => ({
          page: source.page || 1,
          bbox: source.bbox || [0, 0, 100, 100],
          text: source.text || '',
          color: '#4A90D9',
          type: 'summary',
          source: true
        }));
        
        setHighlights(prev => [...prev, ...newHighlights]);
        toast.success('Summary generated successfully!');
      } else {
        toast.error('Summary generation returned empty content. Please try again.');
      }
    },
    onError: (error) => {
      setIsSummarizing(false);
      console.error('Summarization error:', error);
      toast.error('Failed to generate summary: ' + (error.message || 'Unknown error'));
    }
  });

  const handleAskQuestion = (question) => {
    if (!question.trim()) return;
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    }]);
    
    setIsLoading(true);
    askMutation.mutate({ question });
  };

  const handleSummarize = () => {
    if (isSummarizing) return;
    
    if (summaryData) {
      toast('Summary already generated. Click "Show Summary" to view it.', { icon: 'ℹ️' });
      setShowSummary(true);
      return;
    }
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: '📝 Please summarize this paper',
      timestamp: new Date().toISOString()
    }]);
    
    setIsSummarizing(true);
    toast.loading('Generating comprehensive summary...', { id: 'summary-loading' });
    summarizeMutation.mutate();
  };

  const handleDownloadSummary = () => {
    if (!summaryData) return;
    
    const content = `Summary of "${summaryData.title || paper?.title || 'Paper'}"\n\n${'='.repeat(50)}\n\n${summaryData.summary}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${paper?.title || 'paper'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded!');
  };

  const handleCopySummary = () => {
    if (!summaryData) return;
    
    const content = `Summary of "${summaryData.title || paper?.title || 'Paper'}"\n\n${summaryData.summary}`;
    navigator.clipboard.writeText(content);
    toast.success('Summary copied to clipboard!');
  };

  const navigateToHighlight = (page, bbox) => {
    setPageNumber(page);
    setTimeout(() => {
      const highlightElement = document.querySelector(`[data-page="${page}"]`);
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const zoomReset = () => setScale(1.0);

  const suggestedQuestions = [
    "What is the main contribution of this paper?",
    "Explain the methodology used.",
    "What datasets were used?",
    "What are the key findings?",
    "What are the limitations?",
    "Compare this with previous work."
  ];

  if (paperLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800">Paper Not Found</h2>
          <p className="text-gray-600 mt-2">The paper you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pdfUrl = `http://localhost:8000/uploads/${paper.filename}`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* PDF Viewer */}
      <div className={`flex-1 overflow-y-auto p-4 ${chatOpen ? 'mr-96' : ''}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header Controls */}
          <div className="sticky top-0 bg-white shadow-lg z-10 rounded-lg mb-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-semibold truncate max-w-xs md:max-w-md">
                  {paper.title}
                </h2>
              </div>
              
              <div className="flex items-center space-x-2 flex-wrap">
                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={zoomOut}
                    className="px-2 py-1 rounded hover:bg-gray-200 transition"
                    title="Zoom Out"
                  >
                    🔍-
                  </button>
                  <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
                  <button
                    onClick={zoomIn}
                    className="px-2 py-1 rounded hover:bg-gray-200 transition"
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  <button
                    onClick={zoomReset}
                    className="px-2 py-1 rounded hover:bg-gray-200 transition text-xs"
                  >
                    Reset
                  </button>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => goToPage(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className="px-3 py-1 rounded hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    ◀
                  </button>
                  <span className="text-sm px-2">
                    Page {pageNumber} of {numPages || '...'}
                  </span>
                  <button
                    onClick={() => goToPage(pageNumber + 1)}
                    disabled={pageNumber >= numPages}
                    className="px-3 py-1 rounded hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    ▶
                  </button>
                </div>

                {/* Summarize Button */}
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSummarizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Summarizing...
                    </>
                  ) : (
                    '📝 Summarize'
                  )}
                </button>

                {/* Show Summary Button */}
                {summaryData && (
                  <button
                    onClick={() => setShowSummary(!showSummary)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {showSummary ? 'Hide Summary' : 'Show Summary'}
                  </button>
                )}

                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`px-4 py-2 rounded-lg transition ${
                    chatOpen 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {chatOpen ? 'Close Chat' : '💬 Chat'}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Display */}
          {showSummary && summaryData && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-4 border-2 border-green-200 animate-fadeIn">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-green-700">
                    📝 Summary
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {summaryData.title || paper.title}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={handleDownloadSummary}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                  {summaryData.summary}
                </div>
              </div>
              
              {summaryData.sources && summaryData.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600">📖 Sources:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {summaryData.sources.map((source, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateToHighlight(source.page, source.bbox)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        Page {source.page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF Document */}
          <div className="bg-white shadow-lg rounded-lg p-4 relative" ref={containerRef}>
            {pdfError ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-red-600">Failed to Load PDF</h3>
                <p className="text-gray-600 mt-2">{pdfError}</p>
                <button
                  onClick={() => setPdfError(null)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="relative">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => {
                    setNumPages(numPages);
                    setPdfError(null);
                    toast.success(`PDF loaded with ${numPages} pages`);
                  }}
                  onLoadError={(error) => {
                    console.error('PDF load error:', error);
                    setPdfError('Failed to load PDF. Please check if the file exists.');
                    toast.error('Failed to load PDF');
                  }}
                  loading={
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading PDF...</p>
                      </div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>

                {/* Highlight Layer Overlay */}
                {highlights && highlights.length > 0 && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {highlights
                      .filter(h => h.page === pageNumber)
                      .map((highlight, index) => (
                        <div
                          key={`highlight-${index}`}
                          className="highlight-rect absolute cursor-pointer pointer-events-auto"
                          style={{
                            left: `${highlight.bbox?.[0] || 0}%`,
                            top: `${highlight.bbox?.[1] || 0}%`,
                            width: `${(highlight.bbox?.[2] || 100) - (highlight.bbox?.[0] || 0)}%`,
                            height: `${(highlight.bbox?.[3] || 100) - (highlight.bbox?.[1] || 0)}%`,
                            backgroundColor: highlight.color || '#FFD700',
                            opacity: highlight.type === 'summary' ? 0.2 : 0.3,
                            border: `2px solid ${highlight.color || '#FFD700'}`,
                            borderRadius: '2px',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => navigateToHighlight(highlight.page, highlight.bbox)}
                          title={highlight.text || 'Highlighted text'}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = highlight.type === 'summary' ? '0.2' : '0.3';
                          }}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed right-0 top-0 w-96 h-full bg-white shadow-lg border-l border-gray-200 flex flex-col z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🤖</span>
              <h3 className="font-semibold text-gray-800">AI Assistant</h3>
              {paper && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded truncate max-w-[100px]">
                  {paper.title.substring(0, 20)}...
                </span>
              )}
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-800">Ask About This Paper</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Ask questions about the content, methodology, results, or any specific section.
                </p>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="w-full text-left text-xs bg-green-50 hover:bg-green-100 rounded-lg p-3 text-gray-700 transition border border-green-200"
                  >
                    📝 <span className="font-medium">Summarize this paper</span>
                  </button>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(q)}
                      className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-gray-700 transition border border-gray-200"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.isSummary
                          ? 'bg-green-50 text-gray-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-semibold text-gray-600 mb-1">📖 Sources:</p>
                        {message.sources.map((source, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToHighlight(source.page, source.bbox)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline block mt-1 text-left"
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
              ))
            )}
            
            {(isLoading || isSummarizing) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">{isSummarizing ? 'Generating comprehensive summary...' : 'Thinking'}</div>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.querySelector('input');
              if (input.value.trim()) {
                handleAskQuestion(input.value);
                input.value = '';
              }
            }} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSummarizing}
              />
              <button
                type="submit"
                disabled={isLoading || isSummarizing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </form>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex-1 text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                📝 Summarize
              </button>
              {summaryData && (
                <button
                  onClick={handleDownloadSummary}
                  className="flex-1 text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                >
                  ⬇️ Download Summary
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reader;
