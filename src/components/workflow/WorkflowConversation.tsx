import { WorkflowStageList } from "../flows/WorkflowStageList";
import { useWorkflowConversations } from "@/hooks/useWorkflowConversations";
import { useBriefOutputsQuery } from "@/hooks/useBriefOutputsQuery";
import { groupConversationsByStage } from "@/utils/conversationUtils";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
  showOutputs?: boolean;
}

export const WorkflowConversation = ({
  briefId,
  currentStage,
  showOutputs = false
}: WorkflowConversationProps) => {
  const { data: conversations } = useWorkflowConversations(briefId, currentStage);
  const { data: briefOutputs } = useBriefOutputsQuery(briefId, currentStage);

  const conversationsByStage = groupConversationsByStage(conversations);
  // Explicitly type the stages array to match WorkflowStageList props
  const stages: [string, any[]][] = Object.entries(conversationsByStage || {}).map(
    ([stageId, convs]) => [stageId, Array.isArray(convs) ? convs : []]
  );

  console.warn("Rendering WorkflowConversation with:", {
    briefId,
    currentStage,
    conversationsCount: conversations?.length,
    outputsCount: briefOutputs?.length,
    stages,
    showOutputs
  });

  return (
    <div className="space-y-8">
      <WorkflowStageList 
        stages={stages} 
        briefOutputs={briefOutputs || []}
        showOutputs={showOutputs}
      />
    </div>
  );
};