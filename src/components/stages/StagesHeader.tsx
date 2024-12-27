import { Button } from "@/components/ui/button";
import { Plus, ListOrdered } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StageForm } from "@/components/stages/StageForm";

interface StagesHeaderProps {
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
}

export const StagesHeader = ({ isCreating, setIsCreating }: StagesHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-2">
        <ListOrdered className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Stage Builder</h1>
      </div>
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Stage
          </Button>
        </DialogTrigger>
        <DialogContent>
          <StageForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};