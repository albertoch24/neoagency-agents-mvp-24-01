import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
}

export const WorkflowDisplayActions = ({
  currentStage,
  stages,
  onNextStage,
  isProcessing,
  completedStages = []
}: WorkflowDisplayActionsProps) => {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const [isCurrentStageCompleted, setIsCurrentStageCompleted] = useState(false);

  useEffect(() => {
    const checkStageCompletion = async () => {
      try {
        console.log("Checking completion for stage:", currentStage);
        
        // Check in brief_outputs table
        const { data: outputs, error: outputsError } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage_id", currentStage)
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
          hasConversations: !!conversations,
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

  if (isLastStage) return null;

  const handleNextStage = () => {
    if (!isCurrentStageCompleted) {
      toast.error("Please complete the current stage first");
      return;
    }
    console.log("Moving to next stage, current stage completed:", isCurrentStageCompleted);
    onNextStage();
  };

  return (
    <Card>
      <CardContent className="flex justify-end p-4">
        <Button
          onClick={handleNextStage}
          disabled={isProcessing || !isCurrentStageCompleted}
          className="flex items-center gap-2"
        >
          {isProcessing ? "Processing next stage... Please wait" : "Next Stage"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};