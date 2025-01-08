import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

interface WorkflowDisplayActionsProps {
  currentStage: string;
  stages: Stage[];
  onNextStage: () => void;
  isProcessing: boolean;
  completedStages?: string[];
  onStageSelect?: (stage: Stage) => void;
}

export const WorkflowDisplayActions = ({
  currentStage,
  stages,
  onNextStage,
  isProcessing,
  completedStages = [],
  onStageSelect
}: WorkflowDisplayActionsProps) => {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const isFirstStage = currentIndex === 0;
  const [isCurrentStageCompleted, setIsCurrentStageCompleted] = useState(false);

  useEffect(() => {
    const checkStageCompletion = async () => {
      try {
        console.log("Checking completion for stage:", currentStage);
        
        // Check in brief_outputs table
        const { data: outputs, error: outputsError } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage", currentStage)
          .maybeSingle();

        if (outputsError) {
          console.error("Error checking outputs:", outputsError);
        }

        // Check in workflow_conversations table
        const { data: conversations, error: convsError } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("stage_id", currentStage)
          .maybeSingle();

        if (convsError) {
          console.error("Error checking conversations:", convsError);
        }

        const isCompleted = !!outputs || !!conversations;
        console.log("Stage completion check:", { 
          currentStage, 
          isCompleted, 
          hasOutputs: !!outputs, 
          hasConversations: !!conversations
        });
        
        setIsCurrentStageCompleted(isCompleted);
      } catch (error) {
        console.error("Error checking stage completion:", error);
        setIsCurrentStageCompleted(false);
      }
    };

    if (currentStage) {
      checkStageCompletion();
    }
  }, [currentStage]);

  const handleNextStage = () => {
    const nextStage = stages[currentIndex + 1];
    if (!nextStage) {
      console.log("No next stage available");
      return;
    }

    // Use the same logic as stage click
    const isPreviousCompleted = isCurrentStageCompleted;
    const isNextStage = true; // Since this is explicitly for next stage

    console.log("Next stage check:", {
      nextStage,
      isPreviousCompleted,
      isNextStage
    });

    if (isPreviousCompleted && isNextStage) {
      console.log("Moving to next stage:", nextStage);
      if (onStageSelect) {
        onStageSelect(nextStage);
      }
    } else if (!isPreviousCompleted) {
      console.log("Starting current stage processing");
      onNextStage();
    }
  };

  const handlePreviousStage = () => {
    if (isFirstStage) {
      toast.error("This is the first stage");
      return;
    }
    const previousStage = stages[currentIndex - 1];
    if (previousStage && onStageSelect) {
      console.log("Moving to previous stage:", previousStage.id);
      onStageSelect(previousStage);
    }
  };

  if (isLastStage) return null;

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardContent className="flex justify-between items-center p-4">
        {!isFirstStage && (
          <Button
            onClick={handlePreviousStage}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous Stage
          </Button>
        )}
        <Button
          onClick={handleNextStage}
          disabled={isProcessing}
          className="flex items-center gap-2 ml-auto"
        >
          {isProcessing ? (
            "Processing next stage... Please wait"
          ) : !isCurrentStageCompleted ? (
            "Start Stage Processing"
          ) : (
            "Next Stage"
          )}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};