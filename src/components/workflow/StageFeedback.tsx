import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "./feedback/FeedbackForm";
import { useStageFeedback } from "./feedback/useStageFeedback";

interface StageFeedbackProps {
  briefId: string;
  stageId: string;
  onReprocess?: () => void;
}

export const StageFeedback = ({ briefId, stageId, onReprocess }: StageFeedbackProps) => {
  const {
    feedback,
    setFeedback,
    isPermanent,
    setIsPermanent,
    isSubmitting,
    handleSubmit
  } = useStageFeedback({ briefId, stageId });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Stage Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <FeedbackForm
          feedback={feedback}
          isPermanent={isPermanent}
          isSubmitting={isSubmitting}
          onFeedbackChange={setFeedback}
          onPermanentChange={setIsPermanent}
          onSubmit={handleSubmit}
          onReprocess={onReprocess}
        />
      </CardContent>
    </Card>
  );
};