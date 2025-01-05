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

        {isVisible && (
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