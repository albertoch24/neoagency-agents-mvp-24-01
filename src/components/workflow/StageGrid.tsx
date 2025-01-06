import { WorkflowStage } from "@/types/workflow";
import { StageCard } from "./StageCard";

interface StageGridProps {
  stages: WorkflowStage[];
  currentStage: string;
  completedStages?: string[];
  onStageSelect: (stage: WorkflowStage) => void;
  disabled?: boolean;
  stageFlowSteps?: any;
  currentStageIndex: number;
}

export function StageGrid({
  stages,
  currentStage,
  completedStages = [],
  onStageSelect,
  disabled,
  stageFlowSteps,
  currentStageIndex,
}: StageGridProps) {
  const handleStageClick = (stage: WorkflowStage, index: number) => {
    if (disabled) {
      console.log("Stage selection disabled");
      return;
    }

    const isCompleted = completedStages?.includes(stage.id);
    const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
    const isNextStage = index === currentStageIndex + 1;

    if (!isCompleted && !isPreviousCompleted) {
      console.log("Previous stage not completed");
      return;
    }

    if (!isCompleted && !isNextStage) {
      console.log("Not the next stage in sequence");
      return;
    }

    console.log("Stage selected:", stage);
    onStageSelect(stage);
  };

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        if (!stage.name || !stage.description) {
          console.log("Invalid stage data:", stage);
          return null;
        }

        const isActive = currentStage === stage.id;
        const isCompleted = completedStages?.includes(stage.id);
        const isNext = index === currentStageIndex + 1;
        const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
        const isClickable = !disabled && (isCompleted || (isPreviousCompleted && isNext));
        const flowStepsCount = stageFlowSteps?.flows?.flow_steps?.length || 0;

        return (
          <StageCard
            key={stage.id}
            stage={stage}
            isActive={isActive}
            isCompleted={isCompleted}
            isNext={isNext}
            isClickable={isClickable}
            disabled={disabled}
            onClick={() => handleStageClick(stage, index)}
            flowStepsCount={flowStepsCount}
          />
        );
      })}
    </div>
  );
}