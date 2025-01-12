import { buildOutputRequirements } from "./prompt/requirementsBuilder.ts";
import { buildPreviousOutputsSection, buildBriefDetails, buildAgentSkillsSection } from "./prompt/sectionsBuilder.ts";

export const buildPrompt = async (
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) => {
  console.log("Building prompt with:", {
    briefId: brief?.id,
    stageId,
    hasRequirements: !!requirements,
    previousOutputsCount: Array.isArray(previousOutputs) ? previousOutputs.length : 0
  });

  const outputRequirements = buildOutputRequirements(requirements || "");
  const briefDetails = buildBriefDetails(brief);
  const previousOutputsSection = buildPreviousOutputsSection(previousOutputs);
  
  const promptParts = [
    "You are a professional consultant working on a creative project.",
    "",
    "PROJECT BRIEF:",
    briefDetails,
    "",
    "REQUIREMENTS:",
    outputRequirements,
    "",
    "PREVIOUS OUTPUTS:",
    previousOutputsSection,
    "",
    "Please provide your response in two sections:",
    "1. Conversational Response - A natural dialogue discussing your thoughts and recommendations",
    "2. Structured Outputs - A detailed breakdown of your analysis and specific recommendations"
  ];

  return promptParts.join("\n");
};