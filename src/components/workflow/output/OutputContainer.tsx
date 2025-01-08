import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";

interface OutputContainerProps {
  briefId?: string;
  stageId: string;
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

  return <OutputDisplay output={outputs} />;
};