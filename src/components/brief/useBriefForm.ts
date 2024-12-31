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

      // Create/update the brief
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

      // Get the first stage by order_index and its associated flow
      const { data: stage, error: stageError } = await supabase
        .from("stages")
        .select(`
          id,
          name,
          flow_id,
          flows (
            id,
            name,
            flow_steps (
              id,
              agent_id,
              requirements,
              order_index,
              outputs
            )
          )
        `)
        .eq("user_id", user.id)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stageError) {
        console.error("Error fetching stage:", stageError);
        toast.error("Failed to fetch stage information");
        setIsProcessing(false);
        return;
      }

      if (!stage) {
        console.error("No stages found");
        toast.error("No stages found. Please create stages first.");
        setIsProcessing(false);
        return;
      }

      if (!stage.flow_id) {
        console.error("No flow associated with stage:", stage.name);
        toast.error(`Stage "${stage.name}" has no associated flow. Please assign a flow to this stage.`);
        setIsProcessing(false);
        return;
      }

      console.log("Starting workflow with first stage and flow:", { stage, flow: stage.flows });

      const toastId = toast.loading(
        "Starting workflow process... This may take around 2 minutes. Rome wasn't built in a day 😃",
        { duration: Infinity }
      );

      // Get the flow steps in the correct order
      const flowSteps = stage.flows?.flow_steps || [];
      flowSteps.sort((a, b) => a.order_index - b.order_index);

      console.log("Invoking process-workflow-stage function for brief:", brief.id);
      console.log("Flow steps to process:", flowSteps);
      
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: { 
            briefId: brief.id, 
            stageId: stage.id,
            flowId: stage.flow_id,
            flowSteps: flowSteps
          },
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
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });

      setIsProcessing(false);
      onSubmitSuccess?.();
      
      // Navigate to home with the first stage
      navigate(`/?stage=${stage.name}&briefId=${brief.id}`);
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief. Please try again.");
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};