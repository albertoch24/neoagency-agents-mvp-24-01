import { AgentSequence } from "./AgentSequence";
import { StageOutput } from "./StageOutput";

interface WorkflowStageListProps {
  stages: [string, any[]][];
  briefOutputs: Array<{
    stage: string;
    content: {
      response?: string;
      outputs?: Array<{
        agent: string;
        stepId?: string;
        outputs: Array<{
          content: string;
          type?: string;
        }>;
        orderIndex?: number;
        requirements?: string;
      }>;
      [key: string]: any;
    };
    created_at?: string;
    [key: string]: any;
  }>;
  showOutputs?: boolean;
}

export const WorkflowStageList = ({ stages, briefOutputs = [], showOutputs = false }: WorkflowStageListProps) => {
  console.log("WorkflowStageList received stages:", stages);
  console.log("WorkflowStageList received briefOutputs:", briefOutputs);
  console.log("WorkflowStageList showOutputs:", showOutputs);

  return (
    <div className="space-y-8">
      {stages.map(([stageId, conversations]) => {
        const conversationsWithIds = conversations.map((conv: any) => {
          console.log("Processing conversation:", conv);
          console.log("Flow step data:", conv.flow_steps);
          return {
            ...conv,
            stage_id: stageId,
            brief_id: conv.brief_id || (conversations[0]?.brief_id),
            flow_step: {
              ...conv.flow_steps,
              order_index: conv.flow_steps?.order_index ?? 0
            }
          };
        });

        const output = Array.isArray(briefOutputs) 
          ? briefOutputs.find((output) => output.stage === stageId)
          : null;

        console.log("Stage output for", stageId, ":", output);
        console.log("Conversations for stage", stageId, ":", conversationsWithIds);

        const conversationsByStep = conversationsWithIds.reduce((acc: any, conv: any) => {
          const stepId = conv.flow_step_id || `no-step-${conv.id}`;
          if (!acc[stepId]) {
            acc[stepId] = [];
          }
          acc[stepId].push({
            ...conv,
            flow_step: {
              ...conv.flow_step,
              order_index: conv.flow_step?.order_index ?? 0
            }
          });
          return acc;
        }, {});

        return (
          <div key={stageId} className="space-y-6">
            <div className="pl-4 space-y-4">
              {Object.entries(conversationsByStep).map(([stepId, stepConvs]: [string, any[]]) => {
                console.log("Rendering step:", stepId, "with conversations:", stepConvs);
                return (
                  <div key={stepId} className="space-y-4">
                    {showOutputs && <StageOutput output={output} stepId={stepId} />}
                    <AgentSequence conversations={stepConvs} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};