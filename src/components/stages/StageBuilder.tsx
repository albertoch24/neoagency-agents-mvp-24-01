import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface StageBuilderProps {
  stages: Stage[];
}

export const StageBuilder = ({ stages }: StageBuilderProps) => {
  const queryClient = useQueryClient();

  const handleMoveStage = async (stageId: string, direction: "up" | "down") => {
    const currentStage = stages.find((s) => s.id === stageId);
    if (!currentStage) return;

    const currentIndex = stages.findIndex((s) => s.id === stageId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= stages.length) return;

    const otherStage = stages[newIndex];

    try {
      const { error } = await supabase
        .from("stages")
        .upsert([
          { ...currentStage, order_index: newIndex },
          { ...otherStage, order_index: currentIndex },
        ]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage order updated");
    } catch (error) {
      console.error("Error updating stage order:", error);
      toast.error("Failed to update stage order");
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const { error } = await supabase.from("stages").delete().eq("id", stageId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage deleted successfully");
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Failed to delete stage");
    }
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <Card key={stage.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{stage.name}</h3>
                {stage.description && (
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveStage(stage.id, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveStage(stage.id, "down")}
                  disabled={index === stages.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteStage(stage.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {stages.length === 0 && (
        <p className="text-center text-muted-foreground">
          No stages created yet. Click the "Create Stage" button to get started.
        </p>
      )}
    </div>
  );
};