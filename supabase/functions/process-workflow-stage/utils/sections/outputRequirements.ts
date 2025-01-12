import { PromptSection } from "../types";

export function buildOutputRequirementsSection(outputRequirements: string[]): PromptSection {
  console.log("Building output requirements section:", {
    requirementsCount: outputRequirements.length,
    requirements: outputRequirements
  });

  return {
    title: "Output Requirements",
    content: `
Please provide a structured analysis that specifically addresses each of these required outputs:
${outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')}

Format your response with clear headings and bullet points for each required output.
Ensure each response is:
1. Concrete and actionable, directly addressing the specific output requirements.
2. Based on insights from the brief and outputs of previous steps or stages.
3. Structured, using concise bullet points or subheadings to organize information logically.
4. Thorough and exhaustive, covering all relevant aspects to provide a complete response.
5. Professional and direct in tone, avoiding unnecessary elaboration.
6. Focused solely on the outputs, ensuring practical and useful recommendations for each point.
`
  };
}