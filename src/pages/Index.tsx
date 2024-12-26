import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStages } from "@/components/workflow/WorkflowStages";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";
import { WorkflowStage } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState("kickoff");
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

  const { data: brief } = useQuery({
    queryKey: ["brief", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const onSubmit = async (values: any) => {
    try {
      const { error } = await supabase.from("briefs").insert({
        ...values,
        user_id: user?.id,
      });

      if (error) throw error;

      toast.success("Brief submitted successfully");
      form.reset();
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief");
    }
  };

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {!brief ? (
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
                        <Textarea
                          placeholder="Describe your project"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="What are your project objectives?"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="Describe your target audience"
                          {...field}
                        />
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
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{brief.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p><strong>Description:</strong> {brief.description}</p>
                <p><strong>Objectives:</strong> {brief.objectives}</p>
                <p><strong>Target Audience:</strong> {brief.target_audience}</p>
                <p><strong>Budget:</strong> {brief.budget}</p>
                <p><strong>Timeline:</strong> {brief.timeline}</p>
                <p><strong>Current Stage:</strong> {brief.current_stage}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <WorkflowStages
              currentStage={currentStage}
              onStageSelect={handleStageSelect}
            />

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Team Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoleList
                    roles={
                      stages.find((stage) => stage.id === currentStage)?.roles ||
                      []
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stage Outputs</CardTitle>
                </CardHeader>
                <CardContent>
                  <OutputList
                    outputs={
                      stages.find((stage) => stage.id === currentStage)?.outputs ||
                      []
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;