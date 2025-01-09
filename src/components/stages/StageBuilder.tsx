import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Stage } from "@/types/workflow";
import { useState } from "react";

interface StageBuilderProps {
  stages: Stage[];
  briefId?: string;
}

export const StageBuilder = ({ stages, briefId }: StageBuilderProps) => {
  const [selectedStage, setSelectedStage] = useState<string>(stages[0]?.id || '');

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage.id);
  };

  return (
    <div className="space-y-8">
      <WorkflowStages
        stages={stages}
        currentStage={selectedStage}
        onStageSelect={handleStageSelect}
        briefId={briefId}
        isTemplate={!briefId} // Mark as template if no briefId is provided
      />
    </div>
  );
};