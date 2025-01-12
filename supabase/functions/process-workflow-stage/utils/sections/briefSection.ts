import { PromptSection } from "../types";

export function buildBriefDetails(brief: any): PromptSection {
  console.log("Building brief details for:", {
    briefTitle: brief.title,
    hasDescription: !!brief.description,
    hasObjectives: !!brief.objectives
  });
  
  return {
    title: "Brief Details",
    content: `
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
`
  };
}