import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash } from "lucide-react";

interface FlowStepContentProps {
  isEditing: boolean;
  editedOutputs: string;
  editedRequirements: string;
  step: {
    outputs?: { text: string }[];
    requirements?: string;
  };
  onEditOutputs: (value: string) => void;
  onEditRequirements: (value: string) => void;
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
  step,
  onEditOutputs,
  onEditRequirements,
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
            Required Outputs (one per line):
          </label>
          <Textarea
            value={editedOutputs}
            onChange={(e) => onEditOutputs(e.target.value)}
            className="mt-1"
            rows={4}
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
      <div>
        <h4 className="text-sm font-medium mb-2">
          Required Outputs:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          {step.outputs?.map((output, i) => (
            <li key={i} className="text-sm">
              {output.text}
            </li>
          )) || <li>No outputs defined</li>}
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">
          Requirements:
        </h4>
        <p className="text-sm">
          {step.requirements || "No requirements defined"}
        </p>
      </div>
      <div className="flex justify-end gap-2">
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