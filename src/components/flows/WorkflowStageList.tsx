import { AgentSequence } from "./AgentSequence";
import { StageOutput } from "./StageOutput";

interface WorkflowStageListProps {
  stages: [string, any][];
  briefOutputs: any[];
}

export const WorkflowStageList = ({ stages, briefOutputs }: WorkflowStageListProps) => {
  return stages.map(([stage, conversations]) => (
    <div key={stage} className="pl-4 border-l-2">
      <h4 className="font-medium mb-2">Stage: {stage}</h4>
      
      <AgentSequence conversations={conversations} />

      {briefOutputs?.filter((output: any) => output.stage === stage).map((output: any) => (
        <StageOutput key={output.created_at} output={output} />
      ))}
    </div>
  ));
};