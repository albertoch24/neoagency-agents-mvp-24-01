import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, StarHalf } from "lucide-react";
import { processWorkflowStage } from "@/services/workflowService";

interface StageFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  stageId: string;
  briefId: string;
}

export const StageFeedbackDialog = ({
  open,
  onClose,
  stageId,
  briefId,
}: StageFeedbackDialogProps) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [requiresRevision, setRequiresRevision] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);

      // First save the feedback
      const { error: feedbackError } = await supabase.from("stage_feedback").insert({
        stage_id: stageId,
        brief_id: briefId,
        content,
        rating,
        requires_revision: requiresRevision,
      });

      if (feedbackError) throw feedbackError;

      // If revision is required, trigger reprocessing
      if (requiresRevision) {
        console.log("Revision requested, starting reprocessing for stage:", stageId);
        
        // Get the stage data including its flow
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                agents (
                  id,
                  name,
                  description,
                  skills (*)
                )
              )
            )
          `)
          .eq("id", stageId)
          .single();

        if (stageError) throw stageError;

        const flowSteps = stageData?.flows?.flow_steps || [];
        
        // Transform the data to match the Stage type
        const transformedStageData = {
          ...stageData,
          flows: {
            ...stageData.flows,
            flow_steps: flowSteps.map(step => ({
              ...step,
              outputs: step.outputs || [], // Ensure outputs is always an array
            }))
          }
        };
        
        // Start reprocessing
        const toastId = toast.loading(
          "Starting revision process... This may take a few minutes. We're reprocessing the stage with your feedback.",
          { duration: 120000 }
        );

        try {
          await processWorkflowStage(briefId, transformedStageData, flowSteps);
          
          toast.dismiss(toastId);
          toast.success("Stage has been reprocessed with your feedback!");
          
          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
          await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
          await queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
        } catch (error) {
          console.error("Error reprocessing stage:", error);
          toast.dismiss(toastId);
          toast.error("Failed to reprocess the stage. Please try again or contact support.");
          throw error;
        }
      } else {
        toast.success("Feedback submitted successfully");
      }

      await queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Provide Stage Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
              >
                {value <= rating ? (
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarHalf className="h-6 w-6 text-gray-300" />
                )}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Enter your feedback..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiresRevision"
              checked={requiresRevision}
              onChange={(e) => setRequiresRevision(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="requiresRevision">Requires revision</label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!content || rating === 0 || isProcessing}
          >
            {isProcessing ? "Processing..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};