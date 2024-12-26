import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth/AuthProvider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface BriefFormProps {
  initialData?: any;
  onSubmitSuccess?: () => void;
}

const BriefForm = ({ initialData, onSubmitSuccess }: BriefFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      objectives: initialData?.objectives || "",
      target_audience: initialData?.target_audience || "",
      budget: initialData?.budget || "",
      timeline: initialData?.timeline || "",
    },
  });

  const onSubmit = async (values: any) => {
    if (!user) {
      toast.error("You must be logged in to submit a brief");
      return;
    }

    console.log("Submitting brief with values:", values);
    console.log("Current user:", user);

    try {
      toast.info(initialData ? "Updating your brief..." : "Creating your brief...");

      // Update or insert the brief
      const { data: brief, error: briefError } = await supabase
        .from("briefs")
        .upsert({
          ...values,
          id: initialData?.id,
          user_id: user.id,
          current_stage: initialData ? initialData.current_stage : "kickoff",
        })
        .select()
        .single();

      if (briefError) {
        console.error("Error creating/updating brief:", briefError);
        toast.error(briefError.message || "Failed to submit brief");
        return;
      }

      console.log("Brief created/updated successfully:", brief);

      if (!initialData) {
        setIsProcessing(true);
        const toastId = toast.loading("Starting workflow process... This may take a few moments.", {
          duration: Infinity, // Make the toast persistent
        });

        console.log("Invoking process-workflow-stage function for brief:", brief.id);
        
        // Start the workflow process for new briefs
        const { data: workflowData, error: workflowError } = await supabase.functions.invoke(
          "process-workflow-stage",
          {
            body: { briefId: brief.id, stageId: "kickoff" },
          }
        );

        console.log("Workflow function response:", { data: workflowData, error: workflowError });

        if (workflowError) {
          console.error("Error starting workflow:", workflowError);
          toast.dismiss(toastId);
          toast.error("Brief created but workflow failed to start. Please try again or contact support.");
          setIsProcessing(false);
          return;
        }

        toast.dismiss(toastId);
        toast.success("Brief submitted and workflow started successfully!");
        
        // After successful brief creation and workflow start, navigate to the home page
        // This will show the workflow display since it's the default view when a brief exists
        navigate("/");
      }

      // Invalidate the briefs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["brief"] });

      if (!initialData) {
        form.reset();
      }
      
      setIsProcessing(false);
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Brief" : "Submit a Brief"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectives</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What are your project objectives?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your target audience" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project budget" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeline</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project timeline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : initialData ? (
                "Update Brief"
              ) : (
                "Submit Brief"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BriefForm;