import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flow, FlowStep } from "@/types/flow";
import { FlowList } from "./FlowList";
import { FlowPreview } from "./FlowPreview";

interface FlowsContentProps {
  flows: Flow[] | undefined;
  selectedFlow: Flow | null;
  setSelectedFlow: (flow: Flow | null) => void;
  flowSteps: FlowStep[] | undefined;
  applicationFlow: Flow | undefined;
  setShowHistory: (value: boolean) => void;
}

export const FlowsContent = ({
  flows,
  selectedFlow,
  setSelectedFlow,
  flowSteps,
  applicationFlow,
  setShowHistory
}: FlowsContentProps) => {
  if (!flows?.length) {
    return (
      <div className="text-center py-12">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Flows Created</h3>
        <p className="text-muted-foreground">
          Create your first flow to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Available Flows</h2>
          {applicationFlow && (
            <Badge variant="secondary">
              Current Application Flow
            </Badge>
          )}
        </div>
        <FlowList
          flows={flows}
          selectedFlow={selectedFlow}
          onSelectFlow={setSelectedFlow}
          onShowHistory={(flow) => {
            setSelectedFlow(flow);
            setShowHistory(true);
          }}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Flow Preview</h2>
        <Card>
          <CardContent className="p-6">
            {selectedFlow ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedFlow.name}</h3>
                    {selectedFlow.description && (
                      <p className="text-sm text-muted-foreground">{selectedFlow.description}</p>
                    )}
                  </div>
                  <Button onClick={() => setSelectedFlow(null)}>
                    Configure Flow
                  </Button>
                </div>
                <FlowPreview flowSteps={flowSteps} />
              </div>
            ) : applicationFlow ? (
              <div className="text-center py-12">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Select "Application Workflow"</h3>
                <p className="text-muted-foreground">
                  Click on the Application Workflow in the list to see the current project workflow
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Select a Flow</h3>
                <p className="text-muted-foreground">
                  Choose a flow from the left to see its preview
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};