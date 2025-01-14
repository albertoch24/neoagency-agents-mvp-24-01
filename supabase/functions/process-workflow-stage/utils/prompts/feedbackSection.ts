export const buildFeedbackSection = (feedback: string, isReprocessing: boolean) => {
  if (!feedback || !isReprocessing) {
    return '';
  }

  return `
IMPORTANT - Previous Feedback to Address:
${feedback}

You must explicitly address each point in this feedback and explain how your new response incorporates these changes.
`;
};