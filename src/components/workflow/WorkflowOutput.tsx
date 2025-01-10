import { OutputContainer } from "./output/OutputContainer";

interface WorkflowOutputProps {
  briefId?: string;
  stageId: string;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  if (!briefId) return null;
  
  // Convert stageId to stage name if it's a UUID
  const stageName = stageId.includes("-") ? "kickoff" : stageId; // Default to kickoff for first stage
  
  return <OutputContainer briefId={briefId} stage={stageName} />;
};