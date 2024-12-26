import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { WorkflowStage } from "@/types/workflow";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";

export default function Agents() {
  const [currentStage, setCurrentStage] = useState<string>("kickoff");
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const navigate = useNavigate();

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
    setSelectedStage(stage);
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Agency Workflow</h1>
          <p className="text-muted-foreground">
            Manage your agency workflow through structured stages and roles
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGoToHome}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go to Brief
        </Button>
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