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
  isVisible = true,
  onToggleVisibility 
}: StructuredOutputProps) => {
  const [localIsVisible, setLocalIsVisible] = useState(true); // Always start visible

  useEffect(() => {
    setLocalIsVisible(isVisible);
  }, [isVisible]);

  const { data: structuredOutput } = useQuery({
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

  const handleToggle = () => {
    const newVisibility = !localIsVisible;
    setLocalIsVisible(newVisibility);
    onToggleVisibility();
  };

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
            localIsVisible && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={handleToggle}
        >
          <Type className="h-4 w-4" />
          {localIsVisible ? "Hide Structured Output" : "Show Structured Output"}
        </Button>

        {localIsVisible && structuredOutput?.content && (
          <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-4 text-primary">
              Output Strutturato
            </h4>
            <div className="prose prose-sm max-w-none">
              <MarkdownContent content={structuredOutput.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};