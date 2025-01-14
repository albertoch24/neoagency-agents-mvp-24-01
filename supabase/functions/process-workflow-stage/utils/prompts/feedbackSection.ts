export const buildFeedbackSection = (feedback: string, isReprocessing: boolean) => {
  if (!isReprocessing || !feedback) {
    return '';
  }

  const feedbackPoints = feedback.split('\n')
    .filter(point => point.trim())
    .map(point => `- ${point.trim()}`);

  return `
FEEDBACK TO ADDRESS:
The previous response needs improvement based on the following points:
${feedbackPoints.join('\n')}

You MUST explicitly address each of these points in your new response.
`;
};