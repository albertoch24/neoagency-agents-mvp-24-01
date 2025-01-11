import { StageClarificationDialog } from "../StageClarificationDialog";
import { StageFeedbackDialog } from "../StageFeedbackDialog";

interface StageDialogsContainerProps {
  showClarificationDialog: boolean;
  showFeedbackDialog: boolean;
  onClarificationClose: () => void;
  onFeedbackClose: () => void;
  stageId: string;
  briefId: string;
}

export const StageDialogsContainer = ({
  showClarificationDialog,
  showFeedbackDialog,
  onClarificationClose,
  onFeedbackClose,
  stageId,
  briefId,
}: StageDialogsContainerProps) => {
  return (
    <>
      {showClarificationDialog && (
        <StageClarificationDialog
          isOpen={showClarificationDialog}
          onClose={onClarificationClose}
          stageId={stageId}
          briefId={briefId}
        />
      )}
      {showFeedbackDialog && (
        <StageFeedbackDialog
          isOpen={showFeedbackDialog}
          onClose={onFeedbackClose}
          stageId={stageId}
          briefId={briefId}
        />
      )}
    </>
  );
};