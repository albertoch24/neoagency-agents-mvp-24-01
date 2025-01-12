import { formatFeedbackForPrompt } from "./prompt/feedbackFormatter.ts";
import { buildRequirementsPrompt } from "./prompt/requirementsBuilder.ts";
import { buildSectionsPrompt } from "./prompt/sectionsBuilder.ts";

export const buildPrompt = async (
  brief: any,
  stage: any,
  flowStep: any,
  previousOutputs: any[],
  feedback?: string
) => {
  console.log("Building prompt with feedback:", feedback);

  const requirements = buildRequirementsPrompt(flowStep?.requirements || "");
  const sections = buildSectionsPrompt(previousOutputs);
  
  const promptParts = [
    "You are a professional consultant working on a creative project.",
    "",
    "PROJECT BRIEF:",
    `Title: ${brief.title}`,
    `Description: ${brief.description || ""}`,
    `Objectives: ${brief.objectives || ""}`,
    "",
    "REQUIREMENTS:",
    requirements,
    "",
    "PREVIOUS OUTPUTS:",
    sections,
    ""
  ];

  // Add feedback section if provided
  if (feedback) {
    promptParts.push("FEEDBACK TO INCORPORATE:");
    promptParts.push(formatFeedbackForPrompt(feedback));
    promptParts.push("");
  }

  promptParts.push("Please provide your response in two sections:");
  promptParts.push("1. Conversational Response - A natural dialogue discussing your thoughts and recommendations");
  promptParts.push("2. Structured Outputs - A detailed breakdown of your analysis and specific recommendations");
  
  return promptParts.join("\n");
};