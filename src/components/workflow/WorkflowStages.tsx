import { Stage } from "@/types/workflow";
import { StageCard } from "@/components/stages/StageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStagesData } from "@/hooks/useStagesData";

interface WorkflowStagesProps {
  currentStage: string;
  onStageSelect: (stage: Stage) => void;
  briefId?: string;
}

export function WorkflowStages({
  currentStage,
  onStageSelect,
  briefId,
}: WorkflowStagesProps) {
  const { data: stages = [] } = useStagesData(briefId);

  const handleStageClick = (stage: Stage) => {
    onStageSelect(stage);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex space-x-3 pb-4 px-1">
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