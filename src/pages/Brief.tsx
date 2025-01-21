import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { useStageHandling } from "@/hooks/useStageHandling";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Brief = () => {
  const { briefId } = useParams();
  const { currentStage, handleStageSelect } = useStageHandling(briefId);

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ["brief", briefId],
    queryFn: async () => {
      console.log("🔍 Fetching brief details:", { briefId });
      
      if (!briefId) {
        console.error("❌ Brief ID is missing");
        throw new Error("Brief ID is required");
      }

      try {
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
          console.error("❌ Brief not found:", briefId);
          throw new Error("Brief not found");
        }

        console.log("✅ Brief fetched successfully:", {
          id: data.id,
          title: data.title,
          outputsCount: data.brief_outputs?.length || 0
        });
        
        return data;
      } catch (error) {
        console.error("❌ Unexpected error fetching brief:", error);
        toast.error("Failed to load brief details. Please try again.");
        throw error;
      }
    },
    enabled: !!briefId,
    retry: 1,
    retryDelay: 1000
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
    const errorMessage = error instanceof Error ? error.message : "Failed to load brief";
    console.error("❌ Error in Brief component:", { error, briefId });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!brief) {
    console.error("❌ No brief data available:", { briefId });
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