import { format } from "date-fns";
import { WorkflowStageList } from "./WorkflowStageList";

interface WorkflowLogItemProps {
  brief: any;
}

export const WorkflowLogItem = ({ brief }: WorkflowLogItemProps) => {
  const conversationsByStage = brief.workflow_conversations?.reduce((acc: any, conv: any) => {
    if (!acc[conv.stage_id]) {
      acc[conv.stage_id] = [];
    }
    acc[conv.stage_id].push(conv);
    return acc;
  }, {});

  return (
    <div key={brief.id} className="mb-8 border-b pb-6">
      <h3 className="text-lg font-semibold mb-2">
        {brief.title}
        <span className="text-sm font-normal text-muted-foreground ml-2">
          (Created: {format(new Date(brief.created_at), "PPpp")})
        </span>
      </h3>
      
      <div className="space-y-6">
        <WorkflowStageList 
          stages={Object.entries(conversationsByStage || {})} 
          briefOutputs={brief.brief_outputs}
        />
      </div>
    </div>
  );
};