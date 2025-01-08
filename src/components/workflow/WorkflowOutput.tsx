import { OutputContainer } from "./output/OutputContainer";

interface WorkflowOutputProps {
  briefId?: string;
  stageId: string;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  if (!briefId) return null;
  
  return <OutputContainer briefId={briefId} stageId={stageId} />;
};