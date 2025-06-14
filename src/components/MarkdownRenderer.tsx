import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../markdown.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
}

const MarkdownRenderer = ({ content, className = '', maxLines }: MarkdownRendererProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowExpandButton = maxLines !== undefined;

  return (
    <div className={`markdown-content ${className}`}>
      <div 
        className={`${shouldShowExpandButton && !isExpanded ? 'line-clamp-2' : ''}`}
      >
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
      {shouldShowExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-500 hover:text-blue-700 mt-1 focus:outline-none"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
};

export default MarkdownRenderer; 