import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { getPaper, getPaperChunks, askQuestion, createHighlight } from '../services/api';
import ChatInterface from '../components/Chat/ChatInterface';
import HighlightLayer from '../components/PDFViewer/HighlightLayer';
import toast from 'react-hot-toast';

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function Reader() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [highlights, setHighlights] = useState([]);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const containerRef = useRef();

  // Fetch paper data
  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ['paper', paperId],
    queryFn: () => getPaper(paperId)
  });

  // Fetch chunks
  const { data: chunks } = useQuery({
    queryKey: ['chunks', paperId],
    queryFn: () => getPaperChunks(paperId)
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: ({ question }) => askQuestion(question, [parseInt(paperId)]),
    onSuccess: (data) => {
      // Handle highlighting from answer sources
      if (data.results && data.results[0]) {
        const sources = data.results[0].sources || [];
        const newHighlights = sources.map(source => ({
          page: source.page,
          bbox: source.bbox,
          text: source.text,
          color: '#FFD700',
          type: 'ai'
        }));
        setHighlights(prev => [...prev, ...newHighlights]);
        toast.success('Answer received with highlights!');
      }
    }
  });

  // Handle text selection for manual highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      // In production, you'd map selection to chunks
      toast.success('Text selected! Click highlight button to annotate.');
    }
  };

  // Navigate to specific page with highlight
  const navigateToHighlight = (page, bbox) => {
    setPageNumber(page);
    // Scroll to the highlighted area
    setTimeout(() => {
      const highlightElement = document.querySelector(`[data-page="${page}"]`);
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (paperLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading paper...</div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-red-600">Paper not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* PDF Viewer */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Controls */}
          <div className="sticky top-0 bg-white shadow z-10 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold truncate flex-1 mx-4">
                {paper.title}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages || '...'}
                </span>
                <button
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Next
                </button>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {chatOpen ? 'Close Chat' : 'Chat'}
                </button>
              </div>
            </div>
          </div>

          {/* PDF Document */}
          <div className="bg-white shadow-lg rounded-lg p-4" ref={containerRef}>
            <Document
              file={`http://localhost:8000/uploads/${paper.filename}`}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                toast.error('Failed to load PDF');
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>

            {/* Highlight Layer Overlay */}
            <HighlightLayer
              highlights={highlights.filter(h => h.page === pageNumber)}
              onHighlightClick={navigateToHighlight}
            />
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <ChatInterface
            onAsk={(question) => askMutation.mutate({ question })}
            isLoading={askMutation.isPending}
            messages={askMutation.data?.results?.[0]?.answer ? [
              { role: 'user', content: askMutation.variables?.question },
              { role: 'assistant', content: askMutation.data.results[0].answer }
            ] : []}
            onHighlightClick={navigateToHighlight}
          />
        </div>
      )}
    </div>
  );
}

export default Reader;