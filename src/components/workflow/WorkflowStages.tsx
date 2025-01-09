import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkflowStagesProps {
  stages: Stage[];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  briefId?: string;
  onStageMove?: (stageId: string, direction: "up" | "down") => Promise<void>;
  onStageDelete?: (stageId: string) => Promise<void>;
  isTemplate?: boolean;
}

export function WorkflowStages({
  stages,
  currentStage,
  onStageSelect,
  briefId,
}: WorkflowStagesProps) {
  const handleStageClick = (stage: Stage) => {
    onStageSelect(stage);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex space-x-4 pb-4 px-1">
        {stages.map((stage, index) => (
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
        ))}
      </div>
    </ScrollArea>
  );
}