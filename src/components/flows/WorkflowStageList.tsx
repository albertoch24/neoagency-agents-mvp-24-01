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
  console.log("WorkflowStageList received briefOutputs:", briefOutputs); // Debug log

  return (
    <div className="space-y-8">
      {stages.map(([stageId, conversations]) => {
        // Add briefId to each conversation if it's not already present
        const conversationsWithIds = conversations.map((conv: any) => ({
          ...conv,
          stage_id: stageId, // Ensure stage_id is set
          brief_id: conv.brief_id || (conversations[0]?.brief_id) // Use the first conversation's brief_id as fallback
        }));

        const output = Array.isArray(briefOutputs) 
          ? briefOutputs.find((output) => output.stage === stageId)
          : null;

        console.log("Stage output for", stageId, ":", output); // Debug log

        return (
          <div key={stageId} className="space-y-6">
            <div className="pl-4 space-y-4">
              {output && <StageOutput output={output} />}
              <AgentSequence conversations={conversationsWithIds} />
            </div>
          </div>
        );
      })}
    </div>
  );
};