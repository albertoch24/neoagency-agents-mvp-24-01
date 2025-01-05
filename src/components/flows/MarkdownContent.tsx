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
      [&>ul>li]:relative [&>ul>li]:pl-6
      [&>p]:mb-4 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg
      [&>h1,h2,h3,h4]:font-semibold [&>h1,h2,h3,h4]:mb-4 [&>h1,h2,h3,h4]:mt-6
      [&>blockquote]:border-l-4 [&>blockquote]:border-primary/20 
      [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};