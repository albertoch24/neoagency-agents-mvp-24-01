import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { BriefActions } from "@/components/brief/BriefActions";
import { BriefSelector } from "@/components/brief/BriefSelector";
import { useStageHandling } from "@/hooks/useStageHandling";
import { ProjectList } from "@/components/brief/ProjectList";
import { useBriefState } from "@/hooks/useBriefState";

const Index = () => {
  const { user } = useAuth();
  const {
    showNewBrief,
    isEditing,
    selectedBriefId,
    showOutputs,
    handleNewBrief,
    handleEdit,
    handleSubmitSuccess,
    handleSelectBrief
  } = useBriefState();
  
  const { currentStage, handleStageSelect } = useStageHandling(selectedBriefId);

  const { data: briefs, error: briefsError } = useQuery({
    queryKey: ["briefs", user?.id],
    queryFn: async () => {
      console.log("Fetching briefs for user:", user?.id);
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: currentBrief, error: currentBriefError } = useQuery({
    queryKey: ["brief", selectedBriefId || "latest", user?.id],
    queryFn: async () => {
      const query = supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", user?.id);

      if (selectedBriefId) {
        query.eq("id", selectedBriefId);
      } else {
        query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (briefsError || currentBriefError) {
    console.error("Error in briefs query:", briefsError || currentBriefError);
  }

  if (!selectedBriefId && !showNewBrief) {
    return (
      <ProjectList 
        briefs={briefs || []}
        onSelect={handleSelectBrief}
        onEdit={(briefId) => {
          handleSelectBrief(briefId);
          handleEdit();
        }}
        onNew={handleNewBrief}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <BriefActions
          currentBrief={currentBrief}
          showNewBrief={showNewBrief}
          isEditing={isEditing}
          onNewBrief={handleNewBrief}
          onEdit={handleEdit}
        />
        <BriefSelector 
          briefs={briefs || []} 
          onSelect={handleSelectBrief}
        />
      </div>

      {(showNewBrief || !currentBrief || isEditing) ? (
        <BriefForm 
          initialData={isEditing ? currentBrief : undefined}
          onSubmitSuccess={handleSubmitSuccess}
        />
      ) : (
        <>
          <BriefDisplay brief={currentBrief} />
          <div className="-mx-4">
            <WorkflowDisplay
              briefId={currentBrief?.id}
              currentStage={currentStage}
              onStageSelect={handleStageSelect}
              showOutputs={showOutputs}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;