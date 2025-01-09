import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StageForm } from "@/components/stages/StageForm";

interface WorkflowStagesProps {
  stages: Stage[];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  onStageMove?: (stageId: string, direction: "up" | "down") => void;
  onStageDelete?: (stageId: string) => void;
  briefId?: string;
  isTemplate?: boolean;
}

export function WorkflowStages({
  stages,
  currentStage,
  onStageSelect,
  onStageMove,
  onStageDelete,
  briefId,
  isTemplate = false
}: WorkflowStagesProps) {
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const handleStageClick = (stage: Stage, index: number) => {
    onStageSelect(stage);
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
  };

  const handleCloseEdit = () => {
    setEditingStage(null);
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
          canStart={!isTemplate}
          totalStages={stages.length}
          briefId={briefId || ''}
          onStageClick={handleStageClick}
          onMove={onStageMove || (() => {})}
          onEdit={() => handleEdit(stage)}
          onDelete={onStageDelete || (() => {})}
        />
      ))}

      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <StageForm
            onClose={handleCloseEdit}
            editingStage={editingStage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}