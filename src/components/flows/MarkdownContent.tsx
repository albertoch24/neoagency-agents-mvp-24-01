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
      [&>p]:leading-6 [&>ul]:mt-0.5 [&>ul]:list-none [&>ul]:pl-0
      [&>ol]:mt-0 [&>ol]:pl-4 [&>ol>li]:pl-0 [&>ol>li]:mb-0
      [&>ul>li]:relative [&>ul>li]:pl-4 [&>ul>li]:mb-0.5
      [&>p]:mb-1 [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-base
      [&>h1,h2,h3,h4]:font-semibold [&>h1,h2,h3,h4]:mb-1 [&>h1,h2,h3,h4]:mt-4
      [&>blockquote]:border-l-4 [&>blockquote]:border-primary/20 
      [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-1
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
      [&>ol>li>h1,h2,h3,h4]:inline-block [&>ol>li>h1,h2,h3,h4]:mt-0 [&>ol>li>h1,h2,h3,h4]:mb-0
      whitespace-pre-wrap font-mono text-sm">
      <ReactMarkdown>{formattedContent}</ReactMarkdown>
    </div>
  );
};