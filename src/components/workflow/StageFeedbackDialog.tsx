import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "./feedback/FeedbackForm";

interface StageFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  stageId: string;
  briefId: string;
  embedded?: boolean;
}

export const StageFeedbackDialog = ({
  open,
  onClose,
  stageId,
  briefId,
  embedded = false,
}: StageFeedbackDialogProps) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [requiresRevision, setRequiresRevision] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);

      const { error: feedbackError } = await supabase.from("stage_feedback").insert({
        stage_id: stageId,
        brief_id: briefId,
        content,
        rating,
        requires_revision: requiresRevision,
      });

      if (feedbackError) throw feedbackError;

      if (requiresRevision) {
        console.log("Revision requested, starting reprocessing for stage:", stageId);
        
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
        
        const transformedStageData = {
          ...stageData,
          flows: {
            ...stageData.flows,
            flow_steps: flowSteps.map(step => ({
              ...step,
              outputs: step.outputs || [],
              requirements: `${step.requirements || ''}\n\nRevision feedback: ${content}`
            }))
          }
        };
        
        const toastId = toast.loading(
          "Starting revision process... This may take a few minutes. We're reprocessing the stage with your feedback.",
          { duration: 120000 }
        );

        try {
          await processWorkflowStage(briefId, transformedStageData, flowSteps);
          
          toast.dismiss(toastId);
          toast.success("Stage has been reprocessed with your feedback!");
          
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
      if (!embedded) {
        onClose();
      } else {
        setContent("");
        setRating(0);
        setRequiresRevision(false);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsProcessing(false);
    }
  };

  const feedbackForm = (
    <FeedbackForm
      content={content}
      rating={rating}
      requiresRevision={requiresRevision}
      isProcessing={isProcessing}
      embedded={embedded}
      onContentChange={setContent}
      onRatingChange={setRating}
      onRevisionChange={setRequiresRevision}
      onSubmit={handleSubmit}
      onCancel={embedded ? undefined : onClose}
    />
  );

  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stage Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackForm}
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Provide Stage Feedback</DialogTitle>
        </DialogHeader>
        {feedbackForm}
      </DialogContent>
    </Dialog>
  );
};