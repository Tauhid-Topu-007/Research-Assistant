import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

const SearchResults = ({ results, isLoading, query }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-800">No Results Found</h3>
        <p className="text-gray-500 mt-2">
          {query ? `No results found for "${query}"` : 'Start typing to search'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Found {results.length} result(s) for "{query}"
      </p>
      {results.map((result) => (
        <div
          key={result.id}
          onClick={() => navigate(`/reader/${result.id}`)}
          className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition">
            {result.title}
          </h3>
          {result.authors && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              {result.authors.join(', ')}
            </p>
          )}
          {result.abstract && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
              {result.abstract}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <DocumentIcon className="h-4 w-4" />
              {result.total_pages || 0} pages
            </span>
            {result.upload_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(result.upload_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;