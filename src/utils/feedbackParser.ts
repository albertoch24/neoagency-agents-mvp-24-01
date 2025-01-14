import { StructuredFeedback, FeedbackChange } from '@/types/feedback';

export const parseFeedbackContent = (content: string): StructuredFeedback => {
  try {
    // First try to parse as JSON in case it's already structured
    const parsed = JSON.parse(content);
    if (isValidStructuredFeedback(parsed)) {
      return parsed;
    }
  } catch (e) {
    // If not JSON, process as free-form text
    console.log('Processing free-form feedback text');
  }

  // Default structure for free-form text
  return {
    general_feedback: content,
    specific_changes: [],
    priority_level: 'medium',
    target_improvements: [],
    revision_notes: ''
  };
};

export const isValidStructuredFeedback = (data: any): data is StructuredFeedback => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // Validate specific_changes array if present
  if (data.specific_changes && Array.isArray(data.specific_changes)) {
    const validChanges = data.specific_changes.every((change: any) => 
      isValidFeedbackChange(change)
    );
    if (!validChanges) return false;
  }

  // Validate priority_level if present
  if (data.priority_level && 
      !['high', 'medium', 'low'].includes(data.priority_level)) {
    return false;
  }

  // Validate target_improvements if present
  if (data.target_improvements && 
      !Array.isArray(data.target_improvements)) {
    return false;
  }

  return true;
};

const isValidFeedbackChange = (change: any): change is FeedbackChange => {
  return (
    typeof change === 'object' &&
    typeof change.section === 'string' &&
    ['add', 'modify', 'remove'].includes(change.type) &&
    typeof change.content === 'string'
  );
};

export const formatStructuredFeedback = (feedback: StructuredFeedback): string => {
  const parts: string[] = [];

  if (feedback.general_feedback) {
    parts.push(`General Feedback:\n${feedback.general_feedback}`);
  }

  if (feedback.specific_changes.length > 0) {
    parts.push('Specific Changes:');
    feedback.specific_changes.forEach(change => {
      parts.push(`- ${change.type.toUpperCase()} in ${change.section}:\n  ${change.content}`);
    });
  }

  if (feedback.priority_level) {
    parts.push(`Priority Level: ${feedback.priority_level.toUpperCase()}`);
  }

  if (feedback.target_improvements?.length) {
    parts.push('Target Improvements:');
    feedback.target_improvements.forEach(improvement => {
      parts.push(`- ${improvement}`);
    });
  }

  if (feedback.revision_notes) {
    parts.push(`Additional Notes:\n${feedback.revision_notes}`);
  }

  return parts.join('\n\n');
};