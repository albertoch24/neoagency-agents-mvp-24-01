import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stage } from "@/types/workflow";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StageForm } from "./StageForm";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";

interface StageBuilderProps {
  stages: Stage[];
  briefId?: string;
}

export const StageBuilder = ({ stages }: StageBuilderProps) => {
  const [selectedStage, setSelectedStage] = useState<string>(stages[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const handleStageMove = async (stageId: string, direction: "up" | "down") => {
    const currentIndex = stages.findIndex((s) => s.id === stageId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const updatedStages = [...stages];
    const [movedStage] = updatedStages.splice(currentIndex, 1);
    updatedStages.splice(newIndex, 0, movedStage);

    const updates = updatedStages.map((stage, index) => ({
      id: stage.id,
      order_index: index,
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from("stages")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage order updated successfully");
    } catch (error) {
      console.error("Error updating stage order:", error);
      toast.error("Failed to update stage order");
    }
  };

  const handleStageDelete = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from("stages")
        .delete()
        .eq("id", stageId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage deleted successfully");

      if (selectedStage === stageId) {
        const remainingStages = stages.filter(s => s.id !== stageId);
        if (remainingStages.length > 0) {
          setSelectedStage(remainingStages[0].id);
        } else {
          setSelectedStage('');
        }
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Failed to delete stage");
    }
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <Card key={stage.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{stage.name}</h3>
              {stage.description && (
                <p className="text-sm text-gray-500">{stage.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleStageMove(stage.id, "up")}
                disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleStageMove(stage.id, "down")}
                disabled={index === stages.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedStage(stage.id);
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleStageDelete(stage.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <StageForm
            onClose={() => setIsEditing(false)}
            editingStage={stages.find(s => s.id === selectedStage)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};