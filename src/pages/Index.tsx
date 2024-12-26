import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStage } from "@/types/workflow";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import WorkflowDisplay from "@/components/workflow/WorkflowDisplay";

const Index = () => {
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState("kickoff");

  const { data: brief } = useQuery({
    queryKey: ["brief", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching brief:", error);
        return null;
      }

      return data;
    },
    enabled: !!user,
  });

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {!brief ? (
        <BriefForm />
      ) : (
        <div className="space-y-8">
          <BriefDisplay brief={brief} />
          <WorkflowDisplay
            currentStage={currentStage}
            onStageSelect={handleStageSelect}
          />
        </div>
      )}
    </div>
  );
};

export default Index;