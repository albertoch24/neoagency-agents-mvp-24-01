export const formatFeedback = (requirements?: string) => {
  if (!requirements) return { baseRequirements: '', feedbackSection: '' };

  const [baseRequirements, feedbackSection] = requirements.split("Previous feedback received:") || [requirements, ''];
  
  console.log("Processing feedback:", {
    hasBaseRequirements: !!baseRequirements,
    hasFeedbackSection: !!feedbackSection,
    feedbackPreview: feedbackSection?.substring(0, 100)
  });

  // Extract target audience changes if present
  const targetAudienceMatch = feedbackSection?.match(/target.*?(\d+)[:-](\d+)/i);
  const targetLocation = feedbackSection?.match(/abitanti del ([^,\.]+)/i);

  let formattedFeedback = '';
  if (feedbackSection) {
    formattedFeedback = `
Previous feedback received:
${feedbackSection}

IMPORTANT CHANGES REQUESTED:
${targetLocation ? `- Target Location: ${targetLocation[1]}` : ''}
${targetAudienceMatch ? `- Age Range: ${targetAudienceMatch[1]}-${targetAudienceMatch[2]} years` : ''}

Please ensure your response specifically addresses:
1. The updated target audience parameters
2. How this changes your approach and recommendations
3. Any specific cultural or demographic considerations for the new target
4. Alignment with the original brief objectives while incorporating these changes

Original feedback text for reference:
"${feedbackSection.trim()}"
`;
  }

  return {
    baseRequirements: baseRequirements?.trim() || '',
    feedbackSection: formattedFeedback
  };
};