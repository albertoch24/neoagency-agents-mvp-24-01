import { Card } from "@/components/ui/card";
import { MarkdownContent } from "./MarkdownContent";
import { ConversationControls } from "./ConversationControls";

interface ConversationContentProps {
  content: string;
  role?: string;
  isLast?: boolean;
}

export const ConversationContent = ({
  content,
  role = "assistant",
  isLast = false
}: ConversationContentProps) => {
  return (
    <Card className="p-4">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <MarkdownContent content={content} />
      </div>
      {isLast && (
        <div className="mt-4 flex justify-end">
          <ConversationControls content={content} />
        </div>
      )}
    </Card>
  );
};