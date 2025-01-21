import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { useStageHandling } from "@/hooks/useStageHandling";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const Brief = () => {
  const { briefId } = useParams();
  const { currentStage, handleStageSelect } = useStageHandling(briefId);

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ["brief", briefId],
    queryFn: async () => {
      console.log("🔍 Fetching brief details:", { briefId });
      
      if (!briefId) {
        throw new Error("Brief ID is required");
      }

      const { data, error } = await supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("id", briefId)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching brief:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Brief not found");
      }

      console.log("✅ Brief fetched successfully:", data);
      return data;
    },
    enabled: !!briefId,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load brief"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Brief not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <BriefDisplay brief={brief} />
      <div className="-mx-4">
        <WorkflowDisplay
          briefId={brief.id}
          currentStage={currentStage}
          onStageSelect={handleStageSelect}
          showOutputs={true}
        />
      </div>
    </div>
  );
};

export default Brief;