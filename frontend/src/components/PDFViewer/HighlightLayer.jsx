import React, { useState } from 'react';

const HighlightLayer = ({ highlights, onHighlightClick }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="highlight-layer absolute top-0 left-0 w-full h-full pointer-events-none">
      {highlights.map((highlight, index) => (
        <div
          key={`highlight-${index}`}
          className="highlight-rect absolute cursor-pointer pointer-events-auto"
          style={{
            left: `${highlight.bbox?.[0] || 0}%`,
            top: `${highlight.bbox?.[1] || 0}%`,
            width: `${(highlight.bbox?.[2] || 100) - (highlight.bbox?.[0] || 0)}%`,
            height: `${(highlight.bbox?.[3] || 100) - (highlight.bbox?.[1] || 0)}%`,
            backgroundColor: highlight.color || '#FFD700',
            opacity: hoveredIndex === index ? 0.5 : 0.3,
            border: `2px solid ${highlight.color || '#FFD700'}`,
            borderRadius: '2px',
            transition: 'all 0.2s ease',
            boxShadow: hoveredIndex === index ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
          }}
          onClick={() => onHighlightClick(highlight.page, highlight.bbox)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          title={highlight.text || 'Highlighted text'}
        >
          {/* Tooltip on hover */}
          {hoveredIndex === index && highlight.text && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap pointer-events-none">
              {highlight.text.length > 50 ? highlight.text.substring(0, 50) + '...' : highlight.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HighlightLayer;