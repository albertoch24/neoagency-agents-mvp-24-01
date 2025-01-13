import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

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
  const [nextStageHasOutput, setNextStageHasOutput] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkNextStageOutput = async () => {
      if (isLastStage) return;
      
      const nextStage = stages[currentIndex + 1];
      if (!nextStage) return;

      try {
        console.log("Checking outputs for next stage:", {
          nextStageId: nextStage.id,
          nextStageName: nextStage.name
        });

        // Check in brief_outputs table using stage_id
        const { data: outputsById, error: outputsError } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage_id", nextStage.id)
          .limit(1);

        if (outputsError) {
          console.error("Error checking outputs by ID:", outputsError);
        }

        // Check in brief_outputs table using stage name
        const { data: outputsByName, error: outputsNameError } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage", nextStage.name)
          .limit(1);

        if (outputsNameError) {
          console.error("Error checking outputs by name:", outputsNameError);
        }

        // Check in workflow_conversations table
        const { data: conversations, error: convsError } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("stage_id", nextStage.id)
          .limit(1);

        if (convsError) {
          console.error("Error checking conversations:", convsError);
        }

        const hasOutput = !!(
          (outputsById && outputsById.length > 0) || 
          (outputsByName && outputsByName.length > 0) || 
          (conversations && conversations.length > 0)
        );

        console.log("Next stage output check result:", {
          hasOutput,
          outputsById,
          outputsByName,
          conversations
        });
        
        setNextStageHasOutput(hasOutput);
      } catch (error) {
        console.error("Error checking next stage output:", error);
      }
    };

    checkNextStageOutput();
  }, [currentStage, stages, currentIndex, isLastStage]);

  const handleNextStage = () => {
    if (isLastStage) {
      toast.error("This is the last stage");
      return;
    }

    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;

    console.log("Handling next stage:", {
      nextStage,
      hasOutput: nextStageHasOutput,
      willProcess: !nextStageHasOutput
    });

    if (nextStageHasOutput) {
      // Solo navigazione
      if (onStageSelect) {
        console.log("Navigating to next stage:", nextStage.id);
        onStageSelect(nextStage);
      }
    } else {
      // Avvia nuovo processo
      console.log("Starting process for next stage:", nextStage.id);
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
      console.log("Navigating to previous stage:", previousStage.id);
      onStageSelect(previousStage);
    }
  };

  // Non mostrare nulla se siamo nella home page
  if (location.pathname === '/') return null;

  // Non mostrare nulla se è l'ultimo stage
  if (isLastStage) return null;

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardContent className="flex justify-between items-center p-4">
        {!isFirstStage && location.pathname.includes('brief/') && (
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
          ) : nextStageHasOutput ? (
            "Next Stage"
          ) : (
            "Start Stage Processing"
          )}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};