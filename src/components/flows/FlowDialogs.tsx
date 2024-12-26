import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Flow } from "@/types/flow";
import { FlowBuilder } from "./FlowBuilder";
import { FlowHistory } from "./FlowHistory";

interface FlowDialogsProps {
  selectedFlow: Flow | null;
  showHistory: boolean;
  setSelectedFlow: (flow: Flow | null) => void;
  setShowHistory: (value: boolean) => void;
}

export const FlowDialogs = ({
  selectedFlow,
  showHistory,
  setSelectedFlow,
  setShowHistory,
}: FlowDialogsProps) => {
  return (
    <>
      {selectedFlow && !showHistory && (
        <Dialog open={true} onOpenChange={() => setSelectedFlow(null)}>
          <DialogContent className="max-w-4xl">
            <FlowBuilder
              flow={selectedFlow}
              onClose={() => setSelectedFlow(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showHistory && selectedFlow && (
        <Dialog open={true} onOpenChange={() => {
          setShowHistory(false);
          setSelectedFlow(null);
        }}>
          <DialogContent>
            <FlowHistory
              flowId={selectedFlow.id}
              onClose={() => {
                setShowHistory(false);
                setSelectedFlow(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};