import { Stage } from "@/types/workflow";
import { ProjectStages } from "./ProjectStages";
import { WorkflowStageList } from "./WorkflowStageList";

interface WorkflowStagesProps {
  stages: Stage[];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  onStageMove?: (stageId: string, direction: "up" | "down") => void;
  onStageDelete?: (stageId: string) => void;
  briefId?: string;
  isTemplate?: boolean;
}

export const WorkflowStages = ({
  stages,
  currentStage,
  onStageSelect,
  briefId,
}: WorkflowStagesProps) => {
  return (
    <div className="space-y-8">
      <ProjectStages
        stages={stages}
        currentStage={currentStage}
        onStageSelect={onStageSelect}
        briefId={briefId}
      />
      <WorkflowStageList
        stages={stages}
        briefOutputs={[]}
        showOutputs={true}
      />
    </div>
  );
};