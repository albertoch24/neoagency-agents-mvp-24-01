import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";
import { BriefOutput, WorkflowOutputContent } from "@/types/workflow";

interface OutputContainerProps {
  briefId: string;
  stage: string;
}

export const OutputContainer = ({ briefId, stage }: OutputContainerProps) => {
  const { data: output, isLoading, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stage],
    queryFn: async () => {
      console.log("Fetching output for brief:", briefId, "stage:", stage);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stage)
        .maybeSingle();

      if (error) {
        console.error("Error fetching output:", error);
        throw error;
      }

      console.log("Raw output data:", data);

      if (!data) return null;

      // Handle the case where content is a string (JSON)
      let parsedContent: WorkflowOutputContent;
      if (typeof data.content === 'string') {
        try {
          parsedContent = JSON.parse(data.content);
        } catch (e) {
          console.error("Error parsing content:", e);
          throw new Error("Invalid content format");
        }
      } else {
        parsedContent = data.content as WorkflowOutputContent;
      }

      return {
        ...data,
        content: parsedContent
      } as BriefOutput;
    },
    enabled: !!briefId && !!stage
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error as Error} />;
  if (!output) return null;

  return <OutputDisplay output={output} />;
};