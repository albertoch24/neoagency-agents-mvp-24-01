import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";

interface WorkflowStagesProps {
  stages: Stage[];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  briefId?: string;
}

export function WorkflowStages({
  stages,
  currentStage,
  onStageSelect,
  briefId
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
        />
      ))}
    </div>
  );
}