import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";

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
  onStageMove,
  onStageDelete,
  isTemplate
}: WorkflowStagesProps) {
  const handleStageClick = (stage: Stage) => {
    onStageSelect(stage);
  };

  return (
    <div className="space-y-4">
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
          onStageMove={isTemplate ? onStageMove : undefined}
          onStageDelete={isTemplate ? onStageDelete : undefined}
        />
      ))}
    </div>
  );
}