import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

const Controls = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  scale, 
  onScaleChange,
  onFullscreen,
  onSearch,
  onChatToggle,
  chatOpen
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white shadow-lg rounded-lg p-3">
      {/* Page Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded hover:bg-gray-200 transition disabled:opacity-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-sm px-2 min-w-[60px] text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded hover:bg-gray-200 transition disabled:opacity-50"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <MagnifyingGlassMinusIcon className="h-5 w-5" />
        </button>
        <span className="text-sm px-2 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => onScaleChange(Math.min(2.0, scale + 0.1))}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <MagnifyingGlassPlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onFullscreen}
          className="p-1 rounded hover:bg-gray-100 transition"
          title="Fullscreen"
        >
          <ArrowsPointingOutIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onSearch}
          className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          🔍 Search
        </button>
        <button
          onClick={onChatToggle}
          className={`px-3 py-1 rounded-lg transition text-sm ${
            chatOpen 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {chatOpen ? 'Close Chat' : '💬 Chat'}
        </button>
      </div>
    </div>
  );
};

export default Controls;