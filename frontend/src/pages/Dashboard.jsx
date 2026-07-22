import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PDFUploader from '../components/Upload/PDFUploader';
import { getPapers, deletePaper } from '../services/api';
import { 
  DocumentIcon, 
  ChatBubbleLeftIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: papers, isLoading, refetch } = useQuery({
    queryKey: ['papers'],
    queryFn: getPapers
  });

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deletePaper(id);
        toast.success('Paper deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete paper');
      }
    }
  };

  const filteredPapers = papers?.filter(paper => 
    paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (paper.authors && paper.authors.some(author => 
      author.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📚 Research Paper Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Upload, read, and chat with your research papers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              Upload Paper
            </button>
            <button
              onClick={() => refetch()}
              className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upload New Paper</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <PDFUploader onUploadSuccess={() => {
              setShowUpload(false);
              refetch();
            }} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <DocumentIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Papers</p>
                <p className="text-2xl font-bold text-gray-800">{papers?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <ChatBubbleLeftIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions Asked</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Highlights</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Searches</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Papers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredPapers && filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
              >
                <Link to={`/reader/${paper.id}`} className="block p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-2">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {paper.authors && paper.authors.length > 0 
                          ? paper.authors.join(', ')
                          : 'Unknown Author'
                        }
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(paper.id, paper.title);
                      }}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      📄 {paper.total_pages || 0} pages
                    </span>
                    <span>•</span>
                    <span>
                      {paper.upload_date ? new Date(paper.upload_date).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                  
                  {paper.abstract && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {paper.abstract}
                    </p>
                  )}
                  
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Research Paper
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">Click to read →</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-semibold text-gray-800">No Papers Found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm ? 'No papers match your search.' : 'Upload your first research paper to get started!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload Paper
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
