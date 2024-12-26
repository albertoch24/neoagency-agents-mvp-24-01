import { useState } from "react";
import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStage } from "@/types/workflow";

export default function Agents() {
  const [currentStage, setCurrentStage] = useState<string>("kickoff");

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
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
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                View and manage team roles and responsibilities
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Outputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Track and manage deliverables for each stage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
