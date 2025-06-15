import ReactMarkdown from 'react-markdown';
import React, { forwardRef, Ref } from 'react';
import '../markdown.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
  isExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  scrollMaxHeight?: string;
  scrollOverflowY?: 'auto' | 'visible';
}

const MarkdownRenderer = forwardRef(({ 
  content, 
  className = '', 
  maxLines, 
  isExpanded = false,
  onToggle,
  scrollMaxHeight,
  scrollOverflowY
}: MarkdownRendererProps, ref: Ref<HTMLDivElement>) => {
  const shouldShowExpandButton = maxLines !== undefined && content.split('\n').length > maxLines;

  const handleToggle = () => {
    onToggle?.(!isExpanded);
  };

  const divStyle: React.CSSProperties = {};
  if (isExpanded) {
    if (scrollMaxHeight) {
      divStyle.maxHeight = scrollMaxHeight;
    }
    if (scrollOverflowY) {
      divStyle.overflowY = scrollOverflowY;
    }
  } else {
    divStyle.overflowY = 'hidden';
  }

  return (
    <div className={`markdown-content ${className}`}>
      <div
        ref={ref}
        className={`${shouldShowExpandButton && !isExpanded ? 'line-clamp-2' : ''}`}
        style={divStyle}
      >
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
      {shouldShowExpandButton && (
        <button
          onClick={handleToggle}
          className="text-xs text-blue-500 hover:text-blue-700 mt-1 focus:outline-none"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
});

export default MarkdownRenderer;