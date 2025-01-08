import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";
import { Json } from "@/integrations/supabase/types";

interface OutputContainerProps {
  briefId?: string;
  stageId: string;
}

interface BriefOutput {
  id: string;
  brief_id: string;
  stage: string;
  stage_id: string;
  content: Json;
  created_at: string;
  updated_at: string;
}

export const OutputContainer = ({ briefId, stageId }: OutputContainerProps) => {
  const { data: outputs, isLoading, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching outputs for:", { briefId, stageId });
      
      if (!briefId) return null;
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stageId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching outputs:", error);
        throw error;
      }

      console.log("Fetched outputs:", data);
      return data?.[0] || null;
    },
    enabled: !!briefId
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error as Error} />;
  if (!outputs) return null;

  // Ensure content is properly parsed if it's a string
  const parsedOutput = {
    ...outputs,
    content: typeof outputs.content === 'string' ? JSON.parse(outputs.content) : outputs.content
  };

  return <OutputDisplay output={parsedOutput} />;
};