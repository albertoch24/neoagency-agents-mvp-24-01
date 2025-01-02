import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert 
      prose-p:text-foreground/90 prose-headings:text-foreground
      prose-strong:text-foreground prose-strong:font-semibold
      prose-li:text-foreground/90 prose-a:text-primary
      [&>p]:leading-7 [&>ul]:mt-4 [&>ul]:list-none [&>ul]:pl-0
      [&>ul>li]:relative [&>ul>li]:pl-6">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};