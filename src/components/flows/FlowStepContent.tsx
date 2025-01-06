import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash } from "lucide-react";

interface FlowStepContentProps {
  isEditing: boolean;
  editedOutputs: string;
  editedRequirements: string;
  editedDescription?: string;
  step: {
    outputs?: { text: string }[];
    requirements?: string;
    description?: string;
  };
  onEditOutputs: (value: string) => void;
  onEditRequirements: (value: string) => void;
  onEditDescription?: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onRemove: (stepId: string) => void;
  stepId: string;
}

export const FlowStepContent = ({
  isEditing,
  editedOutputs,
  editedRequirements,
  editedDescription = '',
  step,
  onEditOutputs,
  onEditRequirements,
  onEditDescription,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRemove,
  stepId,
}: FlowStepContentProps) => {
  if (isEditing) {
    return (
      <div className="space-y-4 p-4">
        <div>
          <label className="text-sm font-medium">
            Description:
          </label>
          <Textarea
            value={editedDescription}
            onChange={(e) => onEditDescription?.(e.target.value)}
            className="mt-1"
            rows={2}
            placeholder="Enter step description"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Outputs (one per line):
          </label>
          <Textarea
            value={editedOutputs}
            onChange={(e) => onEditOutputs(e.target.value)}
            className="mt-1"
            rows={4}
            placeholder="Enter each output on a new line"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Requirements:
          </label>
          <Textarea
            value={editedRequirements}
            onChange={(e) => onEditRequirements(e.target.value)}
            className="mt-1"
            rows={4}
            placeholder="Enter requirements"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-medium mb-2">
            Description:
          </h4>
          <p className="text-sm">
            {step.description || "No description defined"}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">
            Requirements:
          </h4>
          <p className="text-sm">
            {step.requirements || "No requirements defined"}
          </p>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">
          Outputs:
        </h4>
        <ul className="grid grid-cols-2 gap-4">
          {step.outputs && step.outputs.length > 0 ? (
            step.outputs.map((output, i) => (
              <li key={i} className="text-sm p-2 bg-muted rounded-md">
                {output.text}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">No outputs defined</li>
          )}
        </ul>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onStartEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="destructive"
          onClick={() => onRemove(stepId)}
        >
          <Trash className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </div>
    </div>
  );
};