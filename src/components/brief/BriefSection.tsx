import { useState } from "react";
import BriefForm from "./BriefForm";
import BriefDisplay from "./BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";

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
  const [currentStage, setCurrentStage] = useState("kickoff");

  if (showNewBrief || !currentBrief || isEditing) {
    return (
      <BriefForm 
        initialData={isEditing ? currentBrief : undefined}
        onSubmitSuccess={onEditComplete}
      />
    );
  }

  return (
    <>
      <BriefDisplay brief={currentBrief} />
      <div className="-mx-4">
        <WorkflowDisplay
          currentStage={currentStage}
          onStageSelect={setCurrentStage}
          briefId={currentBrief?.id}
        />
      </div>
    </>
  );
};