import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface WorkflowStagesProps {
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  briefId?: string;
  stages: Stage[];
  onNextStage?: (feedbackId: string | null, targetStageId?: string) => Promise<void>;
}

export function WorkflowStages({
  currentStage,
  onStageSelect,
  briefId,
  stages,
  onNextStage
}: WorkflowStagesProps) {
  const handleStageClick = async (stage: Stage) => {
    if (!stage) {
      console.error("Invalid stage object:", stage);
      toast.error("Error: Invalid stage data");
      return;
    }

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const clickedIndex = stages.findIndex(s => s.id === stage.id);
    
    console.log("🔄 Stage Click Handler:", {
      currentStage,
      clickedStage: stage.id,
      currentIndex,
      clickedIndex,
      stageName: stage.name,
      timestamp: new Date().toISOString()
    });

    // Se si clicca sullo stage corrente, non fare nulla
    if (stage.id === currentStage) {
      return;
    }

    // Se si tenta di saltare degli stage, mostra un errore
    if (clickedIndex > currentIndex + 1) {
      console.warn("⚠️ Cannot skip stages:", {
        currentIndex,
        attemptedIndex: clickedIndex,
        timestamp: new Date().toISOString()
      });
      toast.error("Cannot skip stages. Please complete them in order.");
      return;
    }

    // Se si tenta di tornare a uno stage precedente
    if (clickedIndex < currentIndex) {
      console.log("ℹ️ Navigating to previous stage:", {
        fromStage: stages[currentIndex]?.name || 'Unknown',
        toStage: stage.name,
        timestamp: new Date().toISOString()
      });
      onStageSelect(stage);
      return;
    }

    // Se è lo stage immediatamente successivo, procedi con l'elaborazione
    if (clickedIndex === currentIndex + 1) {
      console.log("🚀 Processing next stage:", {
        fromStage: stages[currentIndex]?.name || 'Unknown',
        toStage: stage.name,
        timestamp: new Date().toISOString()
      });

      try {
        // Prima elabora lo stage
        if (onNextStage) {
          await onNextStage(null, stage.id);
          toast.success(`Processing stage: ${stage.name}`);
        }
        // Poi naviga allo stage
        onStageSelect(stage);
      } catch (error) {
        console.error("❌ Error processing stage:", error);
        toast.error("Failed to process stage. Please try again.");
      }
    }
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex space-x-3 pb-4 px-1">
        {stages.map((stage, index) => {
          if (!stage) {
            console.error("Invalid stage in stages array at index:", index);
            return null;
          }
          
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              isActive={currentStage === stage.id}
              isCompleted={false}
              canStart={!!briefId}
              totalStages={stages.length}
              briefId={briefId || ''}
              onStageClick={handleStageClick}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}