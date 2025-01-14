import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StructuredFeedback, FeedbackPriorityLevel, FeedbackChangeType } from "@/types/feedback";

interface FeedbackFormProps {
  feedback: string;
  isPermanent: boolean;
  isSubmitting: boolean;
  onFeedbackChange: (value: string) => void;
  onPermanentChange: (checked: boolean) => void;
  onSubmit: () => void;
}

export const FeedbackForm = ({
  feedback,
  isPermanent,
  isSubmitting,
  onFeedbackChange,
  onPermanentChange,
  onSubmit,
}: FeedbackFormProps) => {
  const [structuredFeedback, setStructuredFeedback] = useState<StructuredFeedback>({
    general_feedback: feedback,
    specific_changes: [],
    priority_level: 'medium',
    target_improvements: [],
    revision_notes: ''
  });

  const handleStructuredChange = (field: keyof StructuredFeedback, value: any) => {
    setStructuredFeedback(prev => {
      const updated = { ...prev, [field]: value };
      onFeedbackChange(JSON.stringify(updated));
      return updated;
    });
  };

  const addSpecificChange = () => {
    setStructuredFeedback(prev => {
      const updated: StructuredFeedback = {
        ...prev,
        specific_changes: [
          ...prev.specific_changes,
          { section: '', type: 'modify' as FeedbackChangeType, content: '' }
        ]
      };
      onFeedbackChange(JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>General Feedback</Label>
        <Textarea
          placeholder="Enter your general feedback..."
          value={structuredFeedback.general_feedback || ''}
          onChange={(e) => handleStructuredChange('general_feedback', e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Priority Level</Label>
        <Select
          value={structuredFeedback.priority_level}
          onValueChange={(value: FeedbackPriorityLevel) => 
            handleStructuredChange('priority_level', value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>Specific Changes</Label>
        {structuredFeedback.specific_changes.map((change, index) => (
          <div key={index} className="space-y-2">
            <Input
              placeholder="Section to change"
              value={change.section}
              onChange={(e) => {
                const newChanges = [...structuredFeedback.specific_changes];
                newChanges[index] = { ...change, section: e.target.value };
                handleStructuredChange('specific_changes', newChanges);
              }}
            />
            <Select
              value={change.type}
              onValueChange={(value: FeedbackChangeType) => {
                const newChanges = [...structuredFeedback.specific_changes];
                newChanges[index] = { ...change, type: value };
                handleStructuredChange('specific_changes', newChanges);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="modify">Modify</SelectItem>
                <SelectItem value="remove">Remove</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Change details"
              value={change.content}
              onChange={(e) => {
                const newChanges = [...structuredFeedback.specific_changes];
                newChanges[index] = { ...change, content: e.target.value };
                handleStructuredChange('specific_changes', newChanges);
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addSpecificChange}
          className="w-full"
        >
          Add Specific Change
        </Button>
      </div>

      <div className="space-y-4">
        <Label>Revision Notes</Label>
        <Textarea
          placeholder="Additional notes or context..."
          value={structuredFeedback.revision_notes || ''}
          onChange={(e) => handleStructuredChange('revision_notes', e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="permanent"
          checked={isPermanent}
          onCheckedChange={(checked) => onPermanentChange(checked as boolean)}
        />
        <label
          htmlFor="permanent"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Save as brand knowledge (will be used for future briefs)
        </label>
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting and Reprocessing...
          </>
        ) : (
          "Submit Feedback & Reprocess"
        )}
      </Button>
    </div>
  );
};