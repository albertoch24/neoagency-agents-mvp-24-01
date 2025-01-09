import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowDisplayActionsProps {
  currentStage: string;
  stages: any[];
  onNextStage: () => void;
  isProcessing: boolean;
  completedStages?: string[];
  onStageSelect?: (stage: any) => void;
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
          .eq("stage", currentStage);

        if (outputsError) {
          console.error("Error checking outputs:", outputsError);
        }

        // Check in workflow_conversations table
        const { data: conversations, error: convsError } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("stage_id", currentStage);

        if (convsError) {
          console.error("Error checking conversations:", convsError);
        }

        const hasOutputs = outputs && outputs.length > 0;
        const hasConversations = conversations && conversations.length > 0;
        const isCompleted = hasOutputs || hasConversations;

        console.log("Stage completion check:", { 
          currentStage, 
          isCompleted, 
          hasOutputs, 
          hasConversations,
          outputs,
          conversations
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
    if (!isCurrentStageCompleted && !isProcessing) {
      console.log("Starting stage processing...");
      onNextStage();
    } else if (isCurrentStageCompleted) {
      console.log("Moving to next stage, current stage completed:", isCurrentStageCompleted);
      const nextStage = stages[currentIndex + 1];
      if (nextStage && onStageSelect) {
        onStageSelect(nextStage);
      }
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