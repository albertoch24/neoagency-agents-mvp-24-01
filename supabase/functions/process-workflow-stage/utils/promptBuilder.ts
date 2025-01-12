import { buildOutputRequirements } from "./prompt/requirementsBuilder.ts";
import { buildBriefDetails, buildPreviousOutputsSection } from "./prompt/sectionsBuilder.ts";
import { formatFeedbackForPrompt } from "./prompt/feedbackFormatter.ts";

export const buildPrompt = async (
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = [],
  feedback?: string
) => {
  console.log("Building prompt with:", {
    briefId: brief?.id,
    stageId,
    hasRequirements: !!requirements,
    previousOutputsCount: Array.isArray(previousOutputs) ? previousOutputs.length : 0,
    hasFeedback: !!feedback,
    feedbackPreview: feedback?.substring(0, 100)
  });

  const outputRequirements = buildOutputRequirements(requirements || "");
  const briefDetails = buildBriefDetails(brief);
  const previousOutputsSection = buildPreviousOutputsSection(previousOutputs, true); // Force isFirstStage to true
  const feedbackSection = feedback ? formatFeedbackForPrompt(feedback) : "";
  
  const promptParts = [
    "You are a professional consultant working on a creative project.",
    "",
    "PROJECT BRIEF:",
    briefDetails,
    "",
    "REQUIREMENTS:",
    outputRequirements,
  ];

  // Add feedback section if available
  if (feedbackSection) {
    promptParts.push(
      "",
      "FEEDBACK TO INCORPORATE:",
      feedbackSection,
      "",
      "IMPORTANT: Make sure to address ALL the feedback points above in your response."
    );
  }

  // Add previous outputs section only if we have valid outputs
  if (previousOutputsSection) {
    promptParts.push(
      "",
      "PREVIOUS OUTPUTS:",
      previousOutputsSection
    );
  }

  promptParts.push(
    "",
    "Please provide your response in two sections:",
    "1. Conversational Response - A natural dialogue discussing your thoughts and recommendations",
    "2. Structured Outputs - A detailed breakdown of your analysis and specific recommendations"
  );

  const finalPrompt = promptParts.join("\n");

  console.log("Generated prompt:", {
    promptLength: finalPrompt.length,
    preview: finalPrompt.substring(0, 100),
    containsPreviousOutputs: finalPrompt.includes('Previous Stage Outputs'),
    containsRequirements: finalPrompt.includes(requirements || ''),
    containsFeedback: finalPrompt.includes('FEEDBACK TO INCORPORATE'),
    feedbackIncluded: feedback ? finalPrompt.includes(feedback) : 'No feedback provided'
  });

  return finalPrompt;
};