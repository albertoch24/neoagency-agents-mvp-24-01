import React from 'react';
import { MarkdownContent } from "./MarkdownContent";

interface StageSummaryProps {
  summary: string | null;
}

export const StageSummary: React.FC<StageSummaryProps> = ({ summary }) => {
  if (!summary) return null;
  
  return (
    <div className="mt-4 bg-muted rounded-lg p-4">
      <h6 className="text-sm font-medium mb-2">Stage Summary:</h6>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <MarkdownContent content={summary} />
      </div>
    </div>
  );
};