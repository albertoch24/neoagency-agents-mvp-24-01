import { useState } from "react";
import { MarkdownContent } from "./MarkdownContent";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardContent } from "@/components/ui/card";

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
  const { data: structuredOutput, isLoading, error } = useQuery({
    queryKey: ["structured-output", stepId],
    queryFn: async () => {
      console.log("Fetching structured output for step:", stepId);
      
      const { data, error } = await supabase
        .from("structured_outputs")
        .select("*")
        .eq("flow_step_id", stepId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching structured output:", error);
        toast.error("Failed to fetch structured output");
        throw error;
      }

      console.log("Found structured output:", data);
      return data;
    },
    enabled: !!stepId
  });

  if (error) {
    console.error("Query error:", error);
  }

  // Only render if we have stepId
  if (!stepId) return null;

  return (
    <div className="mb-2">
      <div className="space-x-1 flex">
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
          <div className="bg-muted/30 rounded-lg p-2 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-1 text-primary">
              Structured Output
            </h4>
            <CardContent className="p-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div>Loading...</div>
                ) : structuredOutput?.content ? (
                  <div className="rounded-md bg-muted/30 p-4 backdrop-blur-sm">
                    <div className="mb-4 last:mb-0">
                      <MarkdownContent content={structuredOutput.content} />
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {error ? 
                      "Error loading structured output" : 
                      "No structured output available for this step"
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
};