import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PDFUploader from '../components/Upload/PDFUploader';
import { getPapers } from '../services/api';
import { DocumentIcon, ChatBubbleLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  
  const { data: papers, isLoading, refetch } = useQuery({
    queryKey: ['papers'],
    queryFn: getPapers
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          📚 Research Paper Assistant
        </h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Upload Paper
        </button>
      </div>

      {showUpload && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <PDFUploader onUploadSuccess={() => {
            setShowUpload(false);
            refetch();
          }} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DocumentIcon className="h-8 w-8 text-blue-600" />
            <span className="ml-3 text-lg font-semibold">
              {papers?.length || 0} Papers
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChatBubbleLeftIcon className="h-8 w-8 text-green-600" />
            <span className="ml-3 text-lg font-semibold">
              Ask Questions
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-8 w-8 text-purple-600" />
            <span className="ml-3 text-lg font-semibold">
              Semantic Search
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-12">
            Loading papers...
          </div>
        ) : papers && papers.length > 0 ? (
          papers.map((paper) => (
            <Link
              key={paper.id}
              to={`/reader/${paper.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{paper.title}</h3>
              <p className="text-gray-600 text-sm mb-2">
                by {paper.authors.join(', ')}
              </p>
              <p className="text-gray-500 text-sm">
                {paper.total_pages} pages • {new Date(paper.upload_date).toLocaleDateString()}
              </p>
              {paper.abstract && (
                <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                  {paper.abstract}
                </p>
              )}
            </Link>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No papers uploaded yet. Click "Upload Paper" to get started!
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;