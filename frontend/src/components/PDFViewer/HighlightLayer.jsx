import React from 'react';

const HighlightLayer = ({ highlights, onHighlightClick }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="highlight-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className="highlight-rect"
          style={{
            position: 'absolute',
            left: `${highlight.bbox[0]}%`,
            top: `${highlight.bbox[1]}%`,
            width: `${highlight.bbox[2] - highlight.bbox[0]}%`,
            height: `${highlight.bbox[3] - highlight.bbox[1]}%`,
            backgroundColor: highlight.color || '#FFD700',
            opacity: 0.3,
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: '1px solid rgba(255, 215, 0, 0.5)',
          }}
          onClick={() => onHighlightClick(highlight.page, highlight.bbox)}
          title={highlight.text || 'Highlighted text'}
        />
      ))}
    </div>
  );
};

export default HighlightLayer;