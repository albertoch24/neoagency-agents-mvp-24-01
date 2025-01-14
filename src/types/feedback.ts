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

export interface StageFeedbackData {
  id: string;
  stage_id: string;
  brief_id: string;
  content: string;
  structured_content?: StructuredFeedback;
  rating?: number;
  requires_revision: boolean;
  created_at: string;
  updated_at: string;
  is_permanent: boolean;
  processed_for_rag: boolean;
}