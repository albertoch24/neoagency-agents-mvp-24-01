import { useState } from "react";
import { MarkdownContent } from "./MarkdownContent";
import { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface StructuredOutputProps {
  content: Json;
  stepId: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface StructuredContent {
  type?: string;
  content?: string;
  outputs?: Array<{
    stepId: string;
    outputs?: Array<{
      content: string | {
        perimetroContent?: string;
      };
    }>;
  }>;
}

export const StructuredOutput = ({ 
  content, 
  stepId,
  isVisible,
  onToggleVisibility 
}: StructuredOutputProps) => {
  console.log("StructuredOutput rendering:", {
    hasContent: !!content,
    stepId,
    isVisible,
    contentType: typeof content,
    contentValue: content
  });

  const extractPerimetroContent = (structuredContent: StructuredContent) => {
    // First check if it's a direct structured content
    if (structuredContent.type === 'structured' && structuredContent.content) {
      return structuredContent.content;
    }

    // If not direct, look in the outputs array
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
    } catch (error) {
      console.error('Error parsing structured content:', content, error);
      return null;
    }
  };

  const perimetroContent = getPerimetroContent();

  // Only render if we have content or stepId
  if (!content || !stepId) return null;

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            isVisible && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={onToggleVisibility}
        >
          <Type className="h-4 w-4" />
          {isVisible ? "Hide Structured Output" : "Show Structured Output"}
        </Button>

        {isVisible && perimetroContent && (
          <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-4 text-primary">
              Output Strutturato
            </h4>
            <div className="prose prose-sm max-w-none">
              <MarkdownContent content={perimetroContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};