import ReactMarkdown from 'react-markdown';
import '../markdown.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
  isExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

const MarkdownRenderer = ({ 
  content, 
  className = '', 
  maxLines, 
  isExpanded = false,
  onToggle 
}: MarkdownRendererProps) => {
  const shouldShowExpandButton = maxLines !== undefined && content.split('\n').length > maxLines;

  const handleToggle = () => {
    onToggle?.(!isExpanded);
  };

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
          onClick={handleToggle}
          className="text-xs text-blue-500 hover:text-blue-700 mt-1 focus:outline-none"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
};

export default MarkdownRenderer; 