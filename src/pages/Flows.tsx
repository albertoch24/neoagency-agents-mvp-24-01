import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, History } from "lucide-react";
import { FlowForm } from "@/components/flows/FlowForm";
import { FlowBuilder } from "@/components/flows/FlowBuilder";
import { FlowHistory } from "@/components/flows/FlowHistory";

interface Flow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Flow Builder</h1>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flows?.map((flow) => (
          <Card key={flow.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{flow.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFlow(flow);
                    setShowHistory(true);
                  }}
                >
                  <History className="h-4 w-4" />
                </Button>
              </div>
              {flow.description && (
                <p className="text-sm text-muted-foreground">{flow.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => setSelectedFlow(flow)}
              >
                Configure Flow
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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