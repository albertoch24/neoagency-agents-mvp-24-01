import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";

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

      console.log("Fetched output:", data);
      return data;
    },
    enabled: !!briefId && !!stage
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error} />;
  if (!output) return null;

  return <OutputDisplay output={output} />;
};