export const formatFeedback = (requirements?: string) => {
  if (!requirements) return { baseRequirements: '', feedbackSection: '' };

  const [baseRequirements, feedbackSection] = requirements.split("Previous feedback received:") || [requirements, ''];
  
  console.log("Processing feedback:", {
    hasBaseRequirements: !!baseRequirements,
    hasFeedbackSection: !!feedbackSection,
    feedbackPreview: feedbackSection?.substring(0, 100)
  });

  return {
    baseRequirements: baseRequirements || '',
    feedbackSection: feedbackSection ? `
Previous feedback received:
${feedbackSection}

Please ensure your response specifically addresses:
1. The feedback provided above
2. Any requested changes to target audience, objectives, or other aspects
3. How your new response improves upon the previous version
` : ''
  };
};