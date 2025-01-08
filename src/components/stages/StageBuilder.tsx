import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { StageForm } from "./StageForm";
import { useStageProgress } from "./hooks/useStageProgress";
import { StageCard } from "./StageCard";
import { toast } from "sonner";
import { useStageProgression } from "@/hooks/useStageProgression";
import { Stage } from "@/types/workflow";

interface StageBuilderProps {
  stages: Stage[];
}

export const StageBuilder = ({ stages }: StageBuilderProps) => {
  const queryClient = useQueryClient();
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const { currentStage } = useStageProgress();
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});
  const { isStageCompleted, handleStageProgression } = useStageProgression();

  // Check completion status of stages
  useEffect(() => {
    const checkStagesCompletion = async () => {
      const completionStatus: Record<string, boolean> = {};
      for (const stage of stages) {
        completionStatus[stage.id] = await isStageCompleted(stage.id);
      }
      setCompletedStages(completionStatus);
    };

    checkStagesCompletion();
  }, [stages, isStageCompleted]);

  const handleMoveStage = async (stageId: string, direction: "up" | "down") => {
    const currentStage = stages.find((s) => s.id === stageId);
    if (!currentStage) return;

    const currentIndex = stages.findIndex((s) => s.id === stageId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= stages.length) return;

    const otherStage = stages[newIndex];

    try {
      const { error: error1 } = await supabase
        .from("stages")
        .update({ order_index: newIndex })
        .eq("id", currentStage.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("stages")
        .update({ order_index: currentIndex })
        .eq("id", otherStage.id);

      if (error2) throw error2;

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
      {stages.map((stage, index) => {
        const isActive = currentStage === stage.id;
        const isCompleted = completedStages[stage.id];
        const canStart = index === 0 || (index > 0 && completedStages[stages[index - 1].id]);

        return (
          <StageCard
            key={stage.id}
            stage={stage}
            index={index}
            isActive={isActive}
            isCompleted={isCompleted}
            canStart={canStart}
            totalStages={stages.length}
            onStageClick={(stage, index) => handleStageProgression(stage, index, stages)}
            onMove={handleMoveStage}
            onEdit={() => setEditingStage(stage)}
            onDelete={handleDeleteStage}
          />
        );
      })}

      {stages.length === 0 && (
        <p className="text-center text-muted-foreground">
          No stages created yet. Click the "Create Stage" button to get started.
        </p>
      )}

      <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
        <DialogContent>
          <StageForm 
            onClose={() => setEditingStage(null)} 
            editingStage={editingStage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};