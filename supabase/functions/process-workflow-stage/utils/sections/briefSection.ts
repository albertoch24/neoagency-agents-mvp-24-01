import { PromptSection } from "../types.ts";

export const buildBriefDetails = (brief: any): PromptSection => {
  return {
    title: "Brief Details",
    content: `
Title: ${brief.title}
Description: ${brief.description || ''}
Objectives: ${brief.objectives || ''}
Target Audience: ${brief.target_audience || ''}
Budget: ${brief.budget || ''}
Timeline: ${brief.timeline || ''}
Brand: ${brief.brand || ''}
    `.trim()
  };
};