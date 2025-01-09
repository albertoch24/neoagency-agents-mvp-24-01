import { Stage } from "@/types/workflow";
import { StageCard } from "./StageCard";
import { StageControls } from "./StageControls";

interface StageListProps {
  stages: Stage[];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  onStageMove: (stageId: string, newIndex: number) => Promise<void>;
  onStageDelete: (stageId: string) => Promise<void>;
  onStageEdit: (stage: Stage) => void;
  briefId?: string;
  isTemplate?: boolean;
}

export const StageList = ({
  stages,
  currentStage,
  onStageSelect,
  onStageMove,
  onStageDelete,
  onStageEdit,
  briefId,
  isTemplate = false,
}: StageListProps) => {
  const handleStageMove = async (stageId: string, newIndex: number) => {
    if (newIndex < 0 || newIndex >= stages.length) return;
    await onStageMove(stageId, newIndex);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex flex-col gap-2">
          <StageCard
            stage={stage}
            index={index}
            isActive={currentStage === stage.id}
            isCompleted={false}
            canStart={true}
            totalStages={stages.length}
            briefId={briefId || ''}
            onStageClick={onStageSelect}
          />
          {isTemplate && (
            <div className="flex gap-2 justify-center">
              <StageControls
                stage={stage}
                index={index}
                totalStages={stages.length}
                onMove={handleStageMove}
                onEdit={onStageEdit}
                onDelete={onStageDelete}
                isTemplate={isTemplate}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};