import { AgentSequence } from "./AgentSequence";
import { StageOutput } from "./StageOutput";

interface WorkflowStageListProps {
  stages: [string, any[]][];
  briefOutputs: Array<{
    stage: string;
    content: {
      response?: string;
      [key: string]: any;
    };
    created_at?: string;
    [key: string]: any;
  }>;
}

export const WorkflowStageList = ({ stages, briefOutputs = [] }: WorkflowStageListProps) => {
  return (
    <div className="space-y-6">
      {stages.map(([stageId, conversations]) => {
        // Ensure briefOutputs is an array and find the matching output
        const output = Array.isArray(briefOutputs) 
          ? briefOutputs.find((output) => output.stage === stageId)
          : null;

        return (
          <div key={stageId} className="space-y-4">
            <h4 className="text-lg font-semibold capitalize">
              Stage: {stageId}
            </h4>
            
            <div className="pl-4 space-y-4">
              <AgentSequence conversations={conversations} />
              {output && <StageOutput output={output} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};