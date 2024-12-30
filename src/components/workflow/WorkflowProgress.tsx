import { Progress } from "@/components/ui/progress";

interface WorkflowProgressProps {
  stages: any[];
  currentStage: string;
}

export const WorkflowProgress = ({ stages, currentStage }: WorkflowProgressProps) => {
  if (!stages?.length) return null;

  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};