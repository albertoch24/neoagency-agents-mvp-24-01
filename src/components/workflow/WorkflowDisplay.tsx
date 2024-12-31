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
import { useSearchParams } from "react-router-dom";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
}

const WorkflowDisplay = ({ currentStage, onStageSelect, briefId }: WorkflowDisplayProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Fetch stages with their associated flows and flow steps
  const { data: stages } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select(`
          *,
          flows (
            id,
            flow_steps (
              *,
              agents (*)
            )
          )
        `)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const processNextStage = async (nextStage: any) => {
    if (!briefId || !stages) return;
    
    setIsProcessing(true);
    const toastId = toast.loading("Processing next stage...");

    try {
      // Get the flow and flow steps for the next stage
      const flow = nextStage.flows?.[0];
      if (!flow) {
        throw new Error("No flow found for this stage");
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        throw new Error("No flow steps found for this stage");
      }

      console.log("Processing stage with flow:", {
        briefId,
        stageId: nextStage.id,
        flowId: flow.id,
        flowStepsCount: flowSteps.length
      });

      const { error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: { 
            briefId, 
            stageId: nextStage.id,
            flowId: flow.id,
            flowSteps: flowSteps
          },
        }
      );

      if (workflowError) throw workflowError;

      // Update URL params to show outputs for the next stage
      const newParams = new URLSearchParams(searchParams);
      newParams.set("stage", nextStage.id);
      newParams.set("showOutputs", "true");
      setSearchParams(newParams);

      toast.dismiss(toastId);
      toast.success(`Moving to ${nextStage.name} stage`);
      onStageSelect(nextStage);
    } catch (error) {
      console.error("Error processing next stage:", error);
      toast.dismiss(toastId);
      toast.error("Failed to process next stage");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStage = async () => {
    if (!briefId || !stages) return;

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    await processNextStage(nextStage);
  };

  const handleStageSelect = async (stage: any) => {
    if (!briefId || !stages || isProcessing) return;

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const selectedIndex = stages.findIndex(s => s.id === stage.id);

    // Only process if selecting the next stage
    if (selectedIndex === currentIndex + 1) {
      await processNextStage(stage);
    } else {
      onStageSelect(stage);
    }
  };

  return (
    <div className="space-y-8 px-4">
      <WorkflowStages 
        currentStage={currentStage} 
        onStageSelect={handleStageSelect}
        disabled={isProcessing}
      />
      
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
        disabled={isProcessing}
      />
    </div>
  );
};

export default WorkflowDisplay;