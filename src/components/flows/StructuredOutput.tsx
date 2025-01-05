import { MarkdownContent } from "./MarkdownContent";
import { Json } from "@/integrations/supabase/types";

interface StructuredOutputProps {
  content: Json;
  stepId: string;
}

interface StructuredContent {
  outputs?: Array<{
    stepId: string;
    outputs?: Array<{
      content: string | {
        perimetroContent?: string;
      };
    }>;
  }>;
}

export const StructuredOutput = ({ content, stepId }: StructuredOutputProps) => {
  const extractPerimetroContent = (structuredContent: StructuredContent) => {
    const stepOutput = structuredContent.outputs?.find((out) => out.stepId === stepId);

    if (!stepOutput?.outputs) return null;

    return stepOutput.outputs
      .map((out) => {
        try {
          const content = typeof out.content === 'string' ? JSON.parse(out.content) : out.content;
          return content.perimetroContent || null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const getPerimetroContent = () => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content) as StructuredContent;
        return extractPerimetroContent(parsed);
      } catch {
        return null;
      }
    }
    
    try {
      return extractPerimetroContent(content as StructuredContent);
    } catch {
      console.error('Error parsing structured content:', content);
      return null;
    }
  };

  const perimetroContent = getPerimetroContent();

  if (!perimetroContent) return null;

  return (
    <div className="mb-6">
      <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
        <h4 className="text-lg font-semibold mb-4 text-primary">
          Output Strutturato
        </h4>
        <div className="prose prose-sm max-w-none">
          <MarkdownContent content={perimetroContent} />
        </div>
      </div>
    </div>
  );
};