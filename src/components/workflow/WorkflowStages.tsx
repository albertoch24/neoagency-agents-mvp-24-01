import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface WorkflowStagesProps {
  stages: [string, any[]][];
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  briefId?: string;
}

export function WorkflowStages({
  stages,
  currentStage,
  onStageSelect,
  briefId = "",
}: WorkflowStagesProps) {
  const handleStageClick = (stage: Stage) => {
    onStageSelect(stage);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {stages.map(([stageId, conversations], index) => (
          <StageCard
            key={stageId}
            stage={{
              id: stageId,
              name: `Stage ${index + 1}`,
              description: "",
              order_index: index,
              user_id: "",
              flow_id: null,
            }}
            index={index}
            isActive={currentStage === stageId}
            isCompleted={false}
            canStart={!!briefId}
            totalStages={stages.length}
            briefId={briefId}
            onStageClick={handleStageClick}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}