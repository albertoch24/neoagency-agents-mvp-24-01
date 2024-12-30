import { useState, useEffect } from "react";
import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowProgress } from "./WorkflowProgress";
import { WorkflowActions } from "./WorkflowActions";
import { WorkflowConversation } from "./WorkflowConversation";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
}

const WorkflowDisplay = ({ currentStage, onStageSelect, briefId }: WorkflowDisplayProps) => {
  // Fetch stage outputs
  const { data: stageOutputs, isLoading: outputsLoading } = useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      if (!briefId) return [];

      console.log("Fetching outputs for stage:", currentStage);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", currentStage)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      console.log("Found outputs:", data);
      return data;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: stages } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleNextStage = async () => {
    if (!briefId || !stages) return;

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    
    try {
      const toastId = toast.loading("Processing next stage...");

      const { error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: { 
            briefId, 
            stageId: nextStage.id 
          },
        }
      );

      if (workflowError) throw workflowError;

      toast.dismiss(toastId);
      toast.success(`Moving to ${nextStage.name} stage`);
      onStageSelect(nextStage);
    } catch (error) {
      console.error("Error processing next stage:", error);
      toast.error("Failed to process next stage");
    }
  };

  return (
    <div className="space-y-8 px-4">
      <WorkflowStages currentStage={currentStage} onStageSelect={onStageSelect} />
      
      <WorkflowProgress stages={stages} currentStage={currentStage} />

      {briefId && currentStage && (
        <>
          <WorkflowOutput briefId={briefId} stageId={currentStage} />
          <WorkflowConversation briefId={briefId} currentStage={currentStage} />
        </>
      )}

      <WorkflowActions 
        stages={stages} 
        currentStage={currentStage}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default WorkflowDisplay;