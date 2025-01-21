import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

export const useStageHandling = (briefId?: string) => {
  const [currentStage, setCurrentStage] = useState<string>("");

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", briefId],
    queryFn: async () => {
      console.log("🔍 Fetching stages for brief:", briefId);
      
      try {
        // Prima verifichiamo che l'utente sia autenticato
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("User not authenticated");
        }

        // Verifichiamo che il brief esista e appartenga all'utente
        const { data: brief, error: briefError } = await supabase
          .from("briefs")
          .select("current_stage, user_id")
          .eq("id", briefId)
          .single();

        if (briefError) {
          console.error("❌ Error fetching brief:", briefError);
          throw briefError;
        }

        if (brief?.current_stage) {
          console.log("📍 Current stage from brief:", brief.current_stage);
          setCurrentStage(brief.current_stage);
        }

        // Ora recuperiamo gli stages
        const { data, error } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                description
              )
            )
          `)
          .eq("user_id", session.user.id)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("❌ Error fetching stages:", error);
          toast.error("Failed to load stages");
          throw error;
        }

        console.log("✅ Stages fetched successfully:", {
          count: data?.length || 0,
          stages: data?.map(s => ({ id: s.id, name: s.name }))
        });
        
        return data || [];
      } catch (error) {
        console.error("❌ Unexpected error in useStageHandling:", error);
        toast.error("Failed to load stages. Please try again.");
        throw error;
      }
    },
    enabled: !!briefId,
    retry: 2,
    retryDelay: 1000,
    gcTime: 1000 * 60 * 30, // 30 minuti (sostituisce cacheTime)
    staleTime: 1000 * 60 * 5 // 5 minuti
  });

  useEffect(() => {
    if (stages.length > 0 && !currentStage) {
      const firstStage = stages[0];
      console.log("📍 Setting initial stage:", {
        id: firstStage.id,
        name: firstStage.name
      });
      setCurrentStage(firstStage.id);
    }
  }, [stages, currentStage]);

  return {
    currentStage,
    handleStageSelect: (stage: Stage) => {
      console.log("🔄 Selecting stage:", {
        id: stage.id,
        name: stage.name,
        previousStage: currentStage
      });
      setCurrentStage(stage.id);
    }
  };
};