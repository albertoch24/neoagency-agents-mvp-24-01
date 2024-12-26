import { useState } from "react";
import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStage } from "@/types/workflow";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";

export default function Agents() {
  const [currentStage, setCurrentStage] = useState<string>("kickoff");
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
    setSelectedStage(stage);
  };

  return (
    <div className="container mx-auto space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Agency Workflow</h1>
        <p className="text-muted-foreground">
          Manage your agency workflow through structured stages and roles
        </p>
      </div>

      <WorkflowStages currentStage={currentStage} onStageSelect={handleStageSelect} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStage && <RoleList roles={selectedStage.roles} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStage && <OutputList outputs={selectedStage.outputs} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}