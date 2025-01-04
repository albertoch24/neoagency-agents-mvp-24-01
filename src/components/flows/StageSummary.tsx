import { MarkdownContent } from "./MarkdownContent";

interface StageSummaryProps {
  summary: any;
}

export const StageSummary = ({ summary }: StageSummaryProps) => {
  if (!summary) return null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-sm font-medium text-muted-foreground">Stage Summary:</h5>
      </div>
      <div className="bg-muted rounded-lg p-6">
        <MarkdownContent content={summary.content} />
      </div>
    </div>
  );
};