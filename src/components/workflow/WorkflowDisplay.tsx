import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";
import { WorkflowStage } from "@/types/workflow";
import { stages } from "@/components/workflow/WorkflowStages";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: WorkflowStage) => void;
}

const WorkflowDisplay = ({ currentStage, onStageSelect }: WorkflowDisplayProps) => {
  return (
    <div className="space-y-8">
      <WorkflowStages currentStage={currentStage} onStageSelect={onStageSelect} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleList
              roles={stages.find((stage) => stage.id === currentStage)?.roles || []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <OutputList
              outputs={stages.find((stage) => stage.id === currentStage)?.outputs || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDisplay;