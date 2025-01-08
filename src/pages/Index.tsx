import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { useSearchParams } from "react-router-dom";
import { BriefActions } from "@/components/brief/BriefActions";
import { BriefSelector } from "@/components/brief/BriefSelector";
import { useStageHandling } from "@/hooks/useStageHandling";
import { ProjectList } from "@/components/brief/ProjectList";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const { currentStage, handleStageSelect } = useStageHandling(selectedBriefId);
  const [showOutputs, setShowOutputs] = useState(true); // Set default to true

  // Initialize state from URL parameters
  useEffect(() => {
    const briefIdFromUrl = searchParams.get("briefId");
    const showOutputsParam = searchParams.get("showOutputs");
    
    if (briefIdFromUrl) {
      setSelectedBriefId(briefIdFromUrl);
      setShowNewBrief(false);
      setIsEditing(false);
      
      // Always show outputs when selecting a brief
      setShowOutputs(true);
      
      const newParams = new URLSearchParams(searchParams);
      newParams.set("briefId", briefIdFromUrl);
      if (!searchParams.get("stage")) {
        newParams.set("stage", "kickoff");
      }
      newParams.set("showOutputs", "true");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams.get("briefId")]);

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

  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    setShowNewBrief(false);
    setIsEditing(false);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("briefId", briefId);
    newParams.set("showOutputs", "true");
    if (!searchParams.get("stage")) {
      newParams.set("stage", "kickoff");
    }
    setSearchParams(newParams);
    setShowOutputs(true);
  };

  if (briefsError || currentBriefError) {
    console.error("Error in briefs query:", briefsError || currentBriefError);
  }

  // Project list view when no brief is selected
  if (!selectedBriefId && !showNewBrief) {
    return (
      <ProjectList 
        briefs={briefs || []}
        onSelect={handleSelectBrief}
        onEdit={(briefId) => {
          handleSelectBrief(briefId);
          setIsEditing(true);
        }}
        onNew={() => setShowNewBrief(true)}
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
          onNewBrief={() => {
            setShowNewBrief(true);
            setIsEditing(false);
          }}
          onEdit={() => setIsEditing(true)}
        />
        <BriefSelector 
          briefs={briefs || []} 
          onSelect={handleSelectBrief}
        />
      </div>

      {(showNewBrief || !currentBrief || isEditing) ? (
        <BriefForm 
          initialData={isEditing ? currentBrief : undefined}
          onSubmitSuccess={() => {
            setIsEditing(false);
            setSelectedBriefId(null);
          }}
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