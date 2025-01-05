import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  // Try to parse JSON if the content is a JSON string
  let formattedContent = content;
  try {
    const parsed = JSON.parse(content);
    formattedContent = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
  } catch {
    // If parsing fails, use the content as is
    formattedContent = content;
  }

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
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
      whitespace-pre-wrap font-mono text-sm">
      <ReactMarkdown>{formattedContent}</ReactMarkdown>
    </div>
  );
};