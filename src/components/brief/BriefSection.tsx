import { useState } from "react";
import BriefForm from "./BriefForm";
import BriefDisplay from "./BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { WorkflowOutput } from "@/components/workflow/WorkflowOutput";
import { useSearchParams } from "react-router-dom";

interface BriefSectionProps {
  currentBrief: any;
  showNewBrief: boolean;
  isEditing: boolean;
  onEditComplete: () => void;
}

export const BriefSection = ({ 
  currentBrief, 
  showNewBrief, 
  isEditing,
  onEditComplete 
}: BriefSectionProps) => {
  const [searchParams] = useSearchParams();
  const currentStage = searchParams.get("stage") || "kickoff";

  if (showNewBrief || !currentBrief || isEditing) {
    return (
      <BriefForm 
        initialData={isEditing ? currentBrief : undefined}
        onSubmitSuccess={onEditComplete}
      />
    );
  }

  return (
    <div className="space-y-8">
      <BriefDisplay brief={currentBrief} />
      <div className="-mx-4">
        <WorkflowDisplay
          currentStage={currentStage}
          briefId={currentBrief?.id}
        />
      </div>
      {currentBrief?.id && currentStage && (
        <WorkflowOutput 
          briefId={currentBrief.id}
          stageId={currentStage}
        />
      )}
    </div>
  );
};