import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BriefFormData {
  title: string;
  description: string;
  objectives: string;
  target_audience: string;
  budget: string;
  timeline: string;
}

export const useBriefForm = (initialData?: any, onSubmitSuccess?: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: BriefFormData) => {
    if (!user) {
      toast.error("You must be logged in to submit a brief");
      return;
    }

    console.log("Submitting brief with values:", values);
    console.log("Current user:", user);

    try {
      setIsProcessing(true);
      toast.info(initialData ? "Updating your brief..." : "Creating your brief...");

      const { data: brief, error: briefError } = await supabase
        .from("briefs")
        .upsert({
          ...values,
          id: initialData?.id,
          user_id: user.id,
          current_stage: "kickoff",
        })
        .select()
        .single();

      if (briefError) {
        console.error("Error creating/updating brief:", briefError);
        toast.error(briefError.message || "Failed to submit brief");
        setIsProcessing(false);
        return;
      }

      console.log("Brief created/updated successfully:", brief);

      // First, get the stage UUID
      const { data: stage, error: stageError } = await supabase
        .from("stages")
        .select("id")
        .eq("name", "kickoff")
        .maybeSingle();

      if (stageError) {
        console.error("Error fetching stage:", stageError);
        toast.error("Failed to fetch stage information");
        setIsProcessing(false);
        return;
      }

      if (!stage) {
        console.error("Stage not found");
        toast.error("Stage not found");
        setIsProcessing(false);
        return;
      }

      const toastId = toast.loading(
        "Starting workflow process... This may take around 2 minutes. Rome wasn't built in a day 😃",
        { duration: Infinity }
      );

      console.log("Invoking process-workflow-stage function for brief:", brief.id);
      
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: { briefId: brief.id, stageId: stage.id },
        }
      );

      console.log("Workflow function response:", { data: workflowData, error: workflowError });

      if (workflowError) {
        console.error("Error starting workflow:", workflowError);
        toast.dismiss(toastId);
        toast.error("Brief saved but workflow failed to start. Please try again or contact support.");
        setIsProcessing(false);
        return;
      }

      toast.dismiss(toastId);
      toast.success(initialData ? "Brief updated and workflow restarted!" : "Brief submitted and workflow started successfully!");
      
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["brief"] });

      setIsProcessing(false);
      onSubmitSuccess?.();
      
      // Force navigation to home with kickoff stage
      navigate("/?stage=kickoff");
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief. Please try again.");
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};