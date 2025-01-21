import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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
        // Check outputs by stage ID
        const { data: outputsById, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', nextStage.id);

        if (outputError) {
          console.error("Error checking outputs by ID:", outputError);
          throw outputError;
        }

        // Check outputs by stage name
        const { data: outputsByName, error: nameError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage', nextStage.id);

        if (nameError) {
          console.error("Error checking outputs by name:", nameError);
          throw nameError;
        }

        // Check workflow conversations
        const { data: conversations, error: convError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', nextStage.id);

        if (convError) {
          console.error("Error checking conversations:", convError);
          throw convError;
        }

        const hasOutput = (outputsById && outputsById.length > 0) || 
                         (outputsByName && outputsByName.length > 0) ||
                         (conversations && conversations.length > 0);

        console.log("✅ Next stage output check result:", {
          hasOutput,
          outputsById: outputsById?.length || 0,
          outputsByName: outputsByName?.length || 0,
          conversations: conversations?.length || 0,
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

    if (currentStage) {
      checkNextStageOutput();
    }
  }, [currentStage, stages]);

  if (!stages?.length) return null;

  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const nextStage = stages[currentIndex + 1];

  if (isLastStage || !nextStage) return null;

  const handleNextStage = () => {
    console.log("🔄 Handling next stage transition:", {
      stage: {
        id: nextStage.id,
        name: nextStage.name,
        hasFlow: !!nextStage.flow_id,
        flowSteps: nextStage.flows?.flow_steps
      },
      hasOutput: nextStageHasOutput,
      willProcess: !nextStageHasOutput,
      timestamp: new Date().toISOString()
    });

    if (nextStageHasOutput) {
      console.log("✨ Next stage already has output, selecting stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        timestamp: new Date().toISOString()
      });
      onStageSelect?.(nextStage);
    } else {
      // Start new process with proper context
      console.log("⚡ Starting process for next stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flowId: nextStage.flow_id,
        flowSteps: nextStage.flows?.flow_steps,
        timestamp: new Date().toISOString()
      });
      onNextStage(true); // Restored the true flag for proper processing
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
          Next Stage
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};