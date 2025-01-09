import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformContent } from "@/utils/briefOutputs";

export const useBriefOutputsQuery = (briefId: string, currentStage: string) => {
  return useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      console.warn("🔍 Fetching outputs for:", {
        briefId,
        stage: currentStage,
        timestamp: new Date().toISOString()
      });

      try {
        const { data, error } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage", currentStage)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching outputs:", error);
          toast.error("Error loading brief outputs", {
            description: error.message
          });
          throw error;
        }

        if (data && data.length > 0) {
          const dataStructure = Object.keys(data[0]).sort();
          console.warn("🔍 Brief Output Data Structure Check:");
          console.warn("- Fields present:", dataStructure);
          console.warn("- Sample content type:", typeof data[0].content);
          console.warn("- Sample content:", JSON.stringify(data[0].content).substring(0, 100));
          
          if (typeof data[0].content === 'string') {
            console.warn("⚠️ Content is string, expected object");
            toast.warning("Brief output format changed", {
              description: "Content structure needs verification"
            });
          }
        }

        console.warn("Found outputs:", data?.length || 0);
        return data?.map(output => ({
          stage: output.stage,
          content: transformContent(output.content),
          created_at: output.created_at
        }));
      } catch (error) {
        console.error("Error checking outputs:", error);
        toast.error("Error processing brief outputs", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
        return [];
      }
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });
};