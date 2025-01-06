import { AgentSequence } from "../flows/AgentSequence";
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
  console.log("WorkflowStageList received stages:", stages);
  console.log("WorkflowStageList received briefOutputs:", briefOutputs);

  return (
    <div className="space-y-8">
      {stages.map(([stageId, conversations]) => {
        // Add briefId to each conversation if it's not already present
        const conversationsWithIds = conversations.map((conv: any) => ({
          ...conv,
          stage_id: stageId,
          brief_id: conv.brief_id || (conversations[0]?.brief_id)
        }));

        const output = Array.isArray(briefOutputs) 
          ? briefOutputs.find((output) => output.stage === stageId)
          : null;

        console.log("Stage output for", stageId, ":", output);
        console.log("Conversations for stage", stageId, ":", conversationsWithIds);

        // Group conversations by flow step
        const conversationsByStep = conversationsWithIds.reduce((acc: any, conv: any) => {
          const stepId = conv.flow_step_id || `no-step-${conv.id}`;
          if (!acc[stepId]) {
            acc[stepId] = [];
          }
          acc[stepId].push({
            ...conv,
            flow_step: conv.flow_steps // Make sure flow_step data is passed through
          });
          return acc;
        }, {});

        return (
          <div key={stageId} className="space-y-6">
            <div className="pl-4 space-y-4">
              {Object.entries(conversationsByStep).map(([stepId, stepConvs]: [string, any[]]) => (
                <div key={stepId} className="space-y-4">
                  {output && <StageOutput output={output} stepId={stepId} />}
                  <AgentSequence conversations={stepConvs} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};