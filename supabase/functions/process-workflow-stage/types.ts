export type FeedbackChangeType = 'add' | 'modify' | 'remove';
export type FeedbackPriorityLevel = 'high' | 'medium' | 'low';

export interface FeedbackChange {
  section: string;
  type: FeedbackChangeType;
  content: string;
}

export interface StructuredFeedback {
  general_feedback?: string;
  specific_changes: FeedbackChange[];
  priority_level?: FeedbackPriorityLevel;
  target_improvements?: string[];
  revision_notes?: string;
}

export interface ProcessedFeedback {
  generalFeedback: string;
  specificChanges: FeedbackChange[];
  priorityLevel: FeedbackPriorityLevel;
  targetImprovements: string[];
  revisionNotes: string;
}