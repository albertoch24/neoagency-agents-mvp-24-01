import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { Stage } from "@/types/workflow";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StageBuilderProps {
  stages: Stage[];
  briefId?: string;
}

export const StageBuilder = ({ stages, briefId }: StageBuilderProps) => {
  const [selectedStage, setSelectedStage] = useState<string>(stages[0]?.id || '');
  const queryClient = useQueryClient();

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage.id);
  };

  const handleStageMove = async (stageId: string, direction: "up" | "down") => {
    const currentIndex = stages.findIndex((s) => s.id === stageId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const updatedStages = [...stages];
    const [movedStage] = updatedStages.splice(currentIndex, 1);
    updatedStages.splice(newIndex, 0, movedStage);

    // Update order_index for affected stages
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

      // Select the first remaining stage if the deleted stage was selected
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
    <div className="space-y-8">
      <WorkflowStages
        stages={stages}
        currentStage={selectedStage}
        onStageSelect={handleStageSelect}
        onStageMove={handleStageMove}
        onStageDelete={handleStageDelete}
        briefId={briefId}
        isTemplate={!briefId}
      />
    </div>
  );
};