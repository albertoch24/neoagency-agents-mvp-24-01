import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StageClarificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  briefId: string;
}

export const StageClarificationDialog = ({
  isOpen,
  onClose,
  stageId,
  briefId,
}: StageClarificationDialogProps) => {
  const [answer, setAnswer] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from("stage_clarifications")
        .update({ 
          answer,
          status: "answered",
          updated_at: new Date().toISOString()
        })
        .eq("stage_id", stageId)
        .eq("brief_id", briefId)
        .eq("status", "pending");

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["stage-clarifications"] });
      toast.success("Clarification submitted successfully");
      onClose();
    } catch (error) {
      console.error("Error submitting clarification:", error);
      toast.error("Failed to submit clarification");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stage Clarification Required</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Enter your response..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!answer}>
            Submit Response
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};