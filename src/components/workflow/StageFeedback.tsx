import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "./feedback/FeedbackForm";
import { useStageFeedback } from "./feedback/useStageFeedback";

interface StageFeedbackProps {
  briefId: string;
  stageId: string;
  onReprocess?: () => Promise<void>;
}

export const StageFeedback = ({ briefId, stageId, onReprocess }: StageFeedbackProps) => {
  const {
    feedback,
    setFeedback,
    isPermanent,
    setIsPermanent,
    isSubmitting,
    handleSubmit,
    feedbackId
  } = useStageFeedback({ 
    briefId, 
    stageId,
    onReprocess: async () => {
      console.log('Triggering reprocessing with feedback:', { feedbackId });
      if (onReprocess) {
        await onReprocess();
      }
    }
  });

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
        />
      </CardContent>
    </Card>
  );
};