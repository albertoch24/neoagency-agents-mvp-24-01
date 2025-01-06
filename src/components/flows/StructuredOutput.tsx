import { useState, useEffect } from "react";
import { MarkdownContent } from "./MarkdownContent";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StructuredOutputProps {
  stepId: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const StructuredOutput = ({ 
  stepId,
  isVisible,
  onToggleVisibility 
}: StructuredOutputProps) => {
  const { data: structuredOutput, isLoading } = useQuery({
    queryKey: ["structured-output", stepId],
    queryFn: async () => {
      console.log("Fetching structured output for step:", stepId);
      
      const { data, error } = await supabase
        .from("structured_outputs")
        .select("*")
        .eq("flow_step_id", stepId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.error("Error fetching structured output:", error);
        return null;
      }

      console.log("Found structured output:", data);
      return data;
    },
    enabled: !!stepId
  });

  // Only render if we have stepId
  if (!stepId) return null;

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
            {isLoading ? (
              <div>Loading...</div>
            ) : structuredOutput?.content ? (
              <div className="prose prose-sm max-w-none">
                <MarkdownContent content={structuredOutput.content} />
              </div>
            ) : (
              <div className="text-muted-foreground">No structured output available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};