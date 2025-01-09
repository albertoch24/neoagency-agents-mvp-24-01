import { AgentSequence } from "../flows/AgentSequence";
import { StageOutput } from "../flows/StageOutput";

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

export const WorkflowStageList = ({ 
  stages, 
  briefOutputs = [],
  showOutputs = false
}: WorkflowStageListProps) => {
  console.log("WorkflowStageList received stages:", stages);
  console.log("WorkflowStageList received briefOutputs:", briefOutputs);
  console.log("WorkflowStageList showOutputs:", showOutputs);

  // Get only the most recent output for each stage
  const getLatestOutput = (stageId: string) => {
    if (!Array.isArray(briefOutputs)) return null;
    
    const stageOutputs = briefOutputs.filter(output => output.stage === stageId);
    if (!stageOutputs.length) return null;
    
    // Sort by created_at in descending order and take the first one
    return stageOutputs.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
  };

  return (
    <div className="space-y-8">
      {stages.map(([stageId, conversations]) => {
        // Sort conversations by flow step order_index
        const sortedConversations = conversations.sort((a, b) => {
          const aIndex = a.flow_steps?.order_index ?? 0;
          const bIndex = b.flow_steps?.order_index ?? 0;
          return aIndex - bIndex;
        });

        const conversationalOutputs = sortedConversations.map((conv: any) => ({
          ...conv,
          stage_id: stageId,
          brief_id: conv.brief_id || (conversations[0]?.brief_id),
          flow_step: {
            ...conv.flow_steps,
            order_index: conv.flow_steps?.order_index ?? 0
          }
        }));

        // Get only the latest output for this stage
        const latestOutput = getLatestOutput(stageId);

        console.log("Latest output for stage", stageId, ":", latestOutput);
        console.log("Conversations for stage", stageId, ":", conversationalOutputs);

        // Group conversations by flow step ID to maintain step sequence
        const conversationsByStep = conversationalOutputs.reduce((acc: any, conv: any) => {
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

        // Sort steps by order_index
        const sortedSteps = Object.entries(conversationsByStep).sort(([, a]: [string, any[]], [, b]: [string, any[]]) => {
          const aIndex = a[0]?.flow_step?.order_index ?? 0;
          const bIndex = b[0]?.flow_step?.order_index ?? 0;
          return aIndex - bIndex;
        });

        return (
          <div key={stageId} className="space-y-6">
            <div className="pl-4 space-y-4">
              {sortedSteps.map(([stepId, stepConvs]: [string, any[]]) => {
                console.log("Rendering step:", stepId, "with conversations:", stepConvs);
                return (
                  <div key={stepId} className="space-y-4">
                    {latestOutput && showOutputs && (
                      <StageOutput output={latestOutput} stepId={stepId} />
                    )}
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