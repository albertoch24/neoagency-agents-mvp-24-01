import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth/AuthProvider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BriefForm = () => {
  const { user } = useAuth();
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      objectives: "",
      target_audience: "",
      budget: "",
      timeline: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      // Insert the brief
      const { data: brief, error: briefError } = await supabase
        .from("briefs")
        .insert({
          ...values,
          user_id: user?.id,
          current_stage: "kickoff",
        })
        .select()
        .single();

      if (briefError) throw briefError;

      // Start the workflow process
      const { error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: { briefId: brief.id, stageId: "kickoff" },
        }
      );

      if (workflowError) throw workflowError;

      toast.success("Brief submitted and workflow started");
      form.reset();
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Brief</CardTitle>
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
            <Button type="submit">Submit Brief</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BriefForm;