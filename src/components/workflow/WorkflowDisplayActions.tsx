import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WorkflowDisplayActionsProps {
  stages: Stage[];
  currentStage: string;
  onNextStage: (feedbackId: string | null) => void;
  isProcessing?: boolean;
  onStageSelect?: (stage: Stage) => void;
}

export const WorkflowDisplayActions = ({ 
  stages, 
  currentStage, 
  onNextStage,
  isProcessing = false,
  onStageSelect 
}: WorkflowDisplayActionsProps) => {
  const [nextStageHasOutput, setNextStageHasOutput] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentStageProcessed, setCurrentStageProcessed] = useState(false);

  useEffect(() => {
    const checkCurrentStageStatus = async () => {
      if (!currentStage) return;

      try {
        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', currentStage);

        if (outputError) {
          console.error("Error checking current stage outputs:", outputError);
          return;
        }

        setCurrentStageProcessed(outputs && outputs.length > 0);
        
        console.log("🔍 Current stage status check:", {
          stageId: currentStage,
          hasOutputs: outputs && outputs.length > 0,
          outputsCount: outputs?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error checking current stage status:", error);
      }
    };

    checkCurrentStageStatus();
  }, [currentStage]);

  useEffect(() => {
    const checkNextStageOutput = async () => {
      setIsChecking(true);
      const currentIndex = stages.findIndex(s => s.id === currentStage);
      const nextStage = stages[currentIndex + 1];

      if (!nextStage) {
        setIsChecking(false);
        return;
      }

      console.log("🔍 Checking next stage:", {
        nextStageId: nextStage.id,
        nextStageName: nextStage.name,
        hasFlow: !!nextStage.flow_id,
        flowSteps: nextStage.flows?.flow_steps,
        currentIndex,
        totalStages: stages.length,
        timestamp: new Date().toISOString()
      });

      try {
        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', nextStage.id);

        if (outputError) {
          console.error("Error checking outputs:", outputError);
          throw outputError;
        }

        const hasOutput = outputs && outputs.length > 0;

        console.log("✅ Next stage output check result:", {
          hasOutput,
          outputsCount: outputs?.length || 0,
          nextStageId: nextStage.id,
          nextStageName: nextStage.name,
          timestamp: new Date().toISOString()
        });
        
        setNextStageHasOutput(hasOutput);
      } catch (error) {
        console.error("Error checking next stage output:", error);
        setNextStageHasOutput(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (currentStage && currentStageProcessed) {
      checkNextStageOutput();
    }
  }, [currentStage, stages, currentStageProcessed]);

  if (!stages?.length) return null;

  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const nextStage = stages[currentIndex + 1];

  if (isLastStage || !nextStage) return null;

  const handleNextStage = async () => {
    if (!currentStageProcessed) {
      console.log("🚀 Starting current stage processing:", {
        stageId: currentStage,
        stageName: stages.find(s => s.id === currentStage)?.name,
        timestamp: new Date().toISOString()
      });

      try {
        await onNextStage(null);
        toast.success("Stage processing started");
      } catch (error) {
        console.error("Error processing stage:", error);
        toast.error("Failed to process stage");
      }
      return;
    }

    if (nextStageHasOutput) {
      console.log("✨ Next stage already has output, selecting stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        timestamp: new Date().toISOString()
      });
      onStageSelect?.(nextStage);
    } else {
      console.log("⚡ Starting process for next stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flowId: nextStage.flow_id,
        flowSteps: nextStage.flows?.flow_steps,
        timestamp: new Date().toISOString()
      });
      await onNextStage(null);
      toast.success("Processing next stage");
    }
  };

  return (
    <Card>
      <CardContent className="flex justify-end p-4">
        <Button 
          onClick={handleNextStage}
          className="flex items-center gap-2"
          disabled={isProcessing || isChecking}
        >
          {!currentStageProcessed ? 'Process Current Stage' : 'Next Stage'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};