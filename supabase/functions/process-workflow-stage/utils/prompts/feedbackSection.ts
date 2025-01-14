export const buildFeedbackSection = (feedback: string, isReprocessing: boolean): string => {
  if (!feedback || !isReprocessing) {
    return '';
  }

  return `
IMPORTANT - Previous Feedback to Address:
${feedback}

Your response MUST:
1. Explicitly address each point from the feedback
2. Explain how your new response incorporates the feedback
3. Highlight what specific changes you made based on the feedback
4. Be substantially different from the original response

Format your response as follows:

FEEDBACK ADDRESSED:
[List each feedback point and how you addressed it]

UPDATED RESPONSE:
[Your new response incorporating all feedback]

CHANGES MADE:
[List specific changes from original response]
`;
};