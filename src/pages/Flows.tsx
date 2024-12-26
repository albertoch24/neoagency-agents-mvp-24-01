import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, ListChecks, Info } from "lucide-react";
import { FlowForm } from "@/components/flows/FlowForm";
import { FlowBuilder } from "@/components/flows/FlowBuilder";
import { FlowHistory } from "@/components/flows/FlowHistory";
import { FlowList } from "@/components/flows/FlowList";
import { FlowPreview } from "@/components/flows/FlowPreview";
import { Badge } from "@/components/ui/badge";  // Added import for Badge
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Flow {
  id: string;
  name: string;
  description: string | null;
}

interface FlowStep {
  id: string;
  agent_id: string;
  order_index: number;
  outputs?: string[];
  requirements?: string;
  agents: {
    name: string;
    description: string;
  };
}

const Flows = () => {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: flows, isLoading } = useQuery({
    queryKey: ["flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Flow[];
    },
  });

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", selectedFlow?.id],
    queryFn: async () => {
      if (!selectedFlow?.id) return null;
      
      const { data, error } = await supabase
        .from("flow_steps")
        .select(`
          *,
          agents (
            name,
            description
          )
        `)
        .eq("flow_id", selectedFlow.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as FlowStep[];
    },
    enabled: !!selectedFlow?.id,
  });

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const applicationFlow = flows?.find(flow => flow.name === "Application Workflow");

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Flow Builder</h1>
          {applicationFlow && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Current Application Flow</h4>
                  <p className="text-sm text-muted-foreground">
                    This is the main workflow used to process projects. Click on "Application Workflow" in the list to see all stages and details.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Flow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <FlowForm onClose={() => setIsCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {flows && flows.length > 0 ? (
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
      ) : (
        <div className="text-center py-12">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Flows Created</h3>
          <p className="text-muted-foreground">
            Create your first flow to get started
          </p>
        </div>
      )}

      {selectedFlow && !showHistory && (
        <Dialog open={true} onOpenChange={() => setSelectedFlow(null)}>
          <DialogContent className="max-w-4xl">
            <FlowBuilder
              flow={selectedFlow}
              onClose={() => setSelectedFlow(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showHistory && selectedFlow && (
        <Dialog open={true} onOpenChange={() => {
          setShowHistory(false);
          setSelectedFlow(null);
        }}>
          <DialogContent>
            <FlowHistory
              flowId={selectedFlow.id}
              onClose={() => {
                setShowHistory(false);
                setSelectedFlow(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Flows;