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

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
}

const WorkflowDisplay = ({ currentStage, onStageSelect, briefId }: WorkflowDisplayProps) => {
  // Fetch stage outputs
  const { data: stageOutputs } = useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      if (!briefId) return [];

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", currentStage);

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      return data;
    },
    enabled: !!briefId,
  });

  // Fetch all stages to determine progression
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
          body: { briefId, stageId: nextStage.id },
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

      {stageOutputs && stageOutputs.length > 0 && (
        <WorkflowOutput outputs={stageOutputs} />
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