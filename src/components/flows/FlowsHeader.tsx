import { Button } from "@/components/ui/button";
import { Plus, ListChecks, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FlowForm } from "@/components/flows/FlowForm";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Flow } from "@/types/flow";

interface FlowsHeaderProps {
  applicationFlow: Flow | undefined;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
}

export const FlowsHeader = ({ 
  applicationFlow, 
  isCreating, 
  setIsCreating 
}: FlowsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-2">
        <ListChecks className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Flow Builder</h1>
        {applicationFlow && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Current Application Flow</h4>
                <p className="text-sm text-muted-foreground">
                  This is the main workflow used to process projects. Click on "Application Workflow" in the list to see all stages and details.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Flow
          </Button>
        </DialogTrigger>
        <DialogContent>
          <FlowForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};