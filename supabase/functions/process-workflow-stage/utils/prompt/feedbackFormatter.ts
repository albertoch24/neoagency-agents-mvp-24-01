export const formatFeedback = (requirements?: string) => {
  if (!requirements) return { baseRequirements: '', feedbackSection: '' };

  const [baseRequirements, feedbackSection] = requirements.split("Previous feedback received:") || [requirements, ''];
  
  console.log("Processing feedback:", {
    hasBaseRequirements: !!baseRequirements,
    hasFeedbackSection: !!feedbackSection,
    feedbackPreview: feedbackSection?.substring(0, 100)
  });

  let formattedFeedback = '';
  if (feedbackSection) {
    formattedFeedback = `
Previous feedback received:
${feedbackSection}

FEEDBACK ANALYSIS AND IMPLEMENTATION REQUIRED:

1. Key Changes Requested:
   - Analyze and identify all requested modifications
   - Consider both explicit and implicit changes needed
   - Map changes to specific aspects of the brief (audience, strategy, messaging, etc.)

2. Implementation Guidelines:
   - Address each identified change systematically
   - Maintain consistency with unchanged brief elements
   - Ensure all modifications align with overall objectives
   - Consider downstream impacts of requested changes

3. Quality Assurance Points:
   - Verify all feedback points are addressed
   - Confirm changes maintain brief coherence
   - Validate alignment with project goals

Original feedback for reference:
"${feedbackSection.trim()}"
`;
  }

  return {
    baseRequirements: baseRequirements?.trim() || '',
    feedbackSection: formattedFeedback
  };
};